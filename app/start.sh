#!/bin/sh

echo "==> PHP: $(php -v | head -1)"
echo "==> PORT: ${PORT:-8080}"
echo "==> APP_ENV: ${APP_ENV}"
echo "==> DB_HOST: ${DB_HOST}"
echo "==> DB_PORT: ${DB_PORT}"
echo "==> DB_DATABASE: ${DB_DATABASE}"
echo "==> DB_USERNAME: ${DB_USERNAME}"

echo "==> Clearing config cache (file only)..."
php artisan config:clear 2>&1 || true

echo "==> Running migrations..."
php artisan migrate --force 2>&1

echo "==> Caching config..."
php artisan config:cache 2>&1 || echo "WARN: config:cache failed"

echo "==> Caching routes..."
php artisan route:cache 2>&1 || echo "WARN: route:cache failed"

echo "==> Starting Laravel on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
