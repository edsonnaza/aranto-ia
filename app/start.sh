#!/bin/sh
set -e

echo "==> Optimizing autoloader..."
composer dump-autoload --optimize --no-dev

echo "==> Caching config..."
php artisan config:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Caching routes..."
php artisan route:cache

echo "==> Caching views..."
php artisan view:cache

echo "==> Starting server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
