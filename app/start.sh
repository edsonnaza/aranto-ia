#!/bin/sh

echo "==> PHP version: $(php -v | head -1)"
echo "==> PORT: ${PORT:-8000}"
echo "==> APP_ENV: ${APP_ENV}"
echo "==> DB_HOST: ${DB_HOST}"
echo "==> DB_DATABASE: ${DB_DATABASE}"

echo "==> Clearing previous cache..."
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true

echo "==> Running migrations..."
php artisan migrate --force 2>&1
if [ $? -ne 0 ]; then
    echo "!!! Migration failed - check DB connection vars"
    echo "!!! DB_HOST=${DB_HOST} DB_PORT=${DB_PORT} DB_DATABASE=${DB_DATABASE}"
fi

echo "==> Caching config..."
php artisan config:cache 2>&1 || echo "config:cache failed, continuing without cache"

echo "==> Caching routes..."
php artisan route:cache 2>&1 || echo "route:cache failed, continuing without cache"

echo "==> Starting Laravel on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
