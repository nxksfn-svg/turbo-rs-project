#!/bin/sh
set -e

# Railway injects PORT and RAILWAY_PUBLIC_DOMAIN at runtime. Default the
# domain so the container still runs sanely outside Railway (local docker
# run, etc).
: "${RAILWAY_PUBLIC_DOMAIN:=localhost}"
export RAILWAY_PUBLIC_DOMAIN

# nginx.conf: only touch $PORT — $uri etc. are nginx's own variables and
# must survive untouched.
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# Public-facing files that embed the site's own URL. Restricting to
# RAILWAY_PUBLIC_DOMAIN keeps this safe even if any of these ever gain
# other $-looking content.
for f in index.html robots.txt sitemap.xml; do
  envsubst '${RAILWAY_PUBLIC_DOMAIN}' < "/usr/share/nginx/html/$f" > /tmp/out
  mv /tmp/out "/usr/share/nginx/html/$f"
done

exec nginx -g 'daemon off;'
