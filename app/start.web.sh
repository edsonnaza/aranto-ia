#!/bin/sh

echo "==> Service mode: web"
echo "==> PHP: $(php -v | head -1)"
echo "==> PORT: ${PORT:-8080}"

# Cache optimizations are safe for the web service.
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# DO NOT fail deploy if no migrations are pending.
php artisan migrate --force || true

echo "==> Starting Laravel on ${PORT:-8080}..."

exec php artisan serve \
  --host=0.0.0.0 \
  --port="${PORT:-8080}"