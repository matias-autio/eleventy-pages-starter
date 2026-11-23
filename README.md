# Eleventy + Pages CMS starter

A minimal static site you edit through [Pages CMS](https://pagescms.org). Pages are made of blocks, and images are resized automatically at build time.

## What's included

- **Blocks**: rich text (Markdown), full-width image, two columns (image + text, image left or right)
- **Top navigation**, editable in the CMS
- **Site settings** (title, description, language), editable in the CMS
- **Image resizing** with `@11ty/eleventy-img`. Every `<img>` in the output, including images inserted into rich text, becomes a `<picture>` with AVIF, WebP and JPEG at 480, 960, 1600 px and the original width.

## Run locally

```bash
npm install
npm start        # dev server at http://localhost:8080
npm run build    # outputs to _site/
```

Requires Node 20 or newer.

## Connect Pages CMS

1. Push this folder to a GitHub repository.
2. Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub and open the repository. Pages CMS reads `.pages.yml` automatically.
3. Connect the repository to Netlify or Cloudflare Pages (build command `npm run build`, output folder `_site`). Every save in the CMS is a commit, which triggers a rebuild.

## Deploy to Google Cloud Storage (instead of Netlify)

`.github/workflows/deploy-gcs.yml` builds the site and syncs `_site/` to a bucket on every push to `main`, which includes every save in Pages CMS. It signs in to Google Cloud without a stored key (Workload Identity Federation). If you use this, delete `netlify.toml`. If you use Netlify, delete the workflow.

One-time setup (replace the placeholders):

```bash
PROJECT_ID=my-project
BUCKET=www.example.com          # name it after your domain if you'll use a custom domain
REPO=my-github-user/my-site     # GitHub owner/repo
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# 1. Bucket, set up as a public website
gcloud storage buckets create gs://$BUCKET --project=$PROJECT_ID --location=EU --uniform-bucket-level-access
gcloud storage buckets update gs://$BUCKET --web-main-page-suffix=index.html --web-error-page=404.html
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=allUsers --role=roles/storage.objectViewer

# 2. Service account allowed to write to the bucket
gcloud iam service-accounts create site-deployer --project=$PROJECT_ID
SA=site-deployer@$PROJECT_ID.iam.gserviceaccount.com
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=serviceAccount:$SA --role=roles/storage.objectAdmin

# 3. Let GitHub Actions from this repo (and only this repo) use the service account
gcloud iam workload-identity-pools create github --project=$PROJECT_ID --location=global
gcloud iam workload-identity-pools providers create-oidc my-site --project=$PROJECT_ID \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
  --attribute-condition="assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA --project=$PROJECT_ID \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/my-site"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

Then add three repository **variables** in GitHub (Settings → Secrets and variables → Actions → Variables): `GCS_BUCKET`, `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT`.

Serving the bucket on your domain:

- A bucket only serves `index.html` for folder URLs such as `/about/` when it's reached through a custom domain. The `storage.googleapis.com/...` URL won't do this.
- A plain CNAME to `c.storage.googleapis.com` gives you **HTTP only**. For HTTPS, put a Google Cloud external HTTPS load balancer with a backend bucket in front of it, or proxy the domain through Cloudflare.

Caching: resized images (`/img/`) have content-hashed filenames and are cached for a year. Everything else is cached for 5 minutes so edits appear quickly. Adjust this in the workflow.

## Project structure

```
.pages.yml                 CMS configuration (content types, fields, blocks)
eleventy.config.js         Eleventy config (image plugin, markdown filter)
src/
  pages/                   One Markdown file per page (front matter only)
    pages.11tydata.js      Layout and URLs for all pages (index.md -> /)
  _data/
    navigation.json        Top menu items
    site.json              Site title, description, language
  _includes/
    layouts/base.njk       HTML shell, header, nav, footer
    layouts/page.njk       Renders a page's blocks in order
    blocks/*.njk           One partial per block type
  media/                   Uploaded images (Pages CMS saves here)
  assets/css/style.css     All styles
```

## Adding a new block

1. Add an entry under `blocks:` in `.pages.yml`, with a `name` and its `fields`.
2. Create `src/_includes/blocks/<name>.njk`. The block's fields are available as `section.<field>`.
3. Add an `elif` for it in `src/_includes/layouts/page.njk`.
4. Add any styles to `style.css`.

## Notes

- Pages show up in the CMS by title. New pages get their filename (and URL) from the title, e.g. "Our Services" → `/our-services/`. Add them to the navigation by hand.
- Rich-text fields are stored as Markdown and rendered with the `markdown` filter.
- Image sizes are set in `eleventy.config.js` (`widths`, `formats`). Each block sets its own `sizes` attribute to match its layout.
