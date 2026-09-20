#!/usr/bin/env bash
# Upload the downloaded Base44 assets to Cloudflare R2.
#
#   bash migration/upload-r2.sh            # dry run: prints what it would do
#   bash migration/upload-r2.sh --run      # actually create buckets and upload
#
# Two buckets, deliberately:
#   ddalton-designs-assets   public  — portfolio images and site chrome
#   ddalton-designs-private  private — client files
#
# On Base44 the client files sat on a public /files/mp/public/ path protected
# only by an unguessable URL. Splitting them into a private bucket is the point
# of doing this now rather than copying that arrangement across.

set -euo pipefail

PUBLIC_BUCKET="ddalton-designs-assets"
PRIVATE_BUCKET="ddalton-designs-private"
MANIFEST="migration/assets/manifest.json"
FILES="migration/assets/files"

RUN=0
[[ "${1:-}" == "--run" ]] && RUN=1

[[ -f "$MANIFEST" ]] || { echo "missing $MANIFEST — run: node migration/fetch-assets.mjs"; exit 1; }

content_type() {
  case "${1##*.}" in
    png|PNG) echo "image/png" ;;
    jpg|jpeg|JPG|JPEG) echo "image/jpeg" ;;
    webp) echo "image/webp" ;;
    gif) echo "image/gif" ;;
    svg) echo "image/svg+xml" ;;
    pdf) echo "application/pdf" ;;
    heic|HEIC) echo "image/heic" ;;
    eps|EPS) echo "application/postscript" ;;
    mp4) echo "video/mp4" ;;
    mov) echo "video/quicktime" ;;
    *) echo "application/octet-stream" ;;
  esac
}

run() {
  if [[ $RUN -eq 1 ]]; then "$@"; else echo "  [dry-run] $*"; fi
}

echo "Creating buckets..."
run npx wrangler r2 bucket create "$PUBLIC_BUCKET"
run npx wrangler r2 bucket create "$PRIVATE_BUCKET"
echo

n=0
while IFS=$'\t' read -r key; do
  [[ -z "$key" ]] && continue
  src="$FILES/$key"
  [[ -f "$src" ]] || { echo "  MISSING $src"; continue; }

  # client-files/* are private; everything else is public.
  if [[ "$key" == client-files/* ]]; then bucket="$PRIVATE_BUCKET"; else bucket="$PUBLIC_BUCKET"; fi

  ct=$(content_type "$key")
  run npx wrangler r2 object put "$bucket/$key" --file "$src" --content-type "$ct" --remote
  n=$((n+1))
done < <(node -e '
  const m=require("./migration/assets/manifest.json");
  for (const a of m.assets) console.log(a.key);
')

echo
echo "$n objects $( [[ $RUN -eq 1 ]] && echo uploaded || echo 'would be uploaded' )"
if [[ $RUN -eq 0 ]]; then
  echo
  echo "Dry run only. Re-run with --run to apply."
else
  echo
  echo "Next: connect a custom domain (e.g. assets.ddaltondesigns.com) to $PUBLIC_BUCKET"
  echo "in the Cloudflare dashboard, then rewrite the data URLs:"
  echo "  node migration/rewrite-urls.mjs https://assets.ddaltondesigns.com"
fi
