# #!/bin/sh

# echo "==> PHP: $(php -v | head -1)"
# echo "==> PORT: ${PORT:-8080}"
# echo "==> APP_ENV: ${APP_ENV}"
# echo "==> DB_HOST: ${DB_HOST}"
# echo "==> DB_DATABASE: ${DB_DATABASE}"
# echo "==> DB_USERNAME: ${DB_USERNAME}"

# # Verify Vite manifest exists
# if [ ! -f /var/www/html/public/build/manifest.json ]; then
#     echo "FATAL: Vite manifest not found at public/build/manifest.json"
#     exit 1
# fi
# echo "==> Vite manifest OK ($(cat /var/www/html/public/build/manifest.json | grep -c '"' ) entries)"

# echo "==> Clearing file caches..."
# php artisan config:clear 2>&1 || true
# php artisan route:clear 2>&1 || true
# php artisan view:clear 2>&1 || true

# echo "==> Running migrations..."
# php artisan migrate --force 2>&1

# echo "==> Starting Laravel on port ${PORT:-8080}..."
# exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"



#!/bin/sh

echo "==> Starting Laravel..."
echo "==> PHP: $(php -v | head -1)"
echo "==> PORT: ${PORT:-8080}"

# cache optimizations (safe in production)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# DO NOT fail deploy if no migrations needed
php artisan migrate --force || true

echo "==> Starting server on ${PORT:-8080}..."

exec php artisan serve \
  --host=0.0.0.0 \
  --port=${PORT:-8080}