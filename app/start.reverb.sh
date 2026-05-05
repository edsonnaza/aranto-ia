#!/bin/sh

echo "==> Service mode: reverb"
echo "==> PHP: $(php -v | head -1)"
echo "==> PORT: ${PORT:-8080}"

php artisan config:cache || true

echo "==> Starting Reverb on ${PORT:-8080}..."

exec php artisan reverb:start \
  --host=0.0.0.0 \
  --port="${PORT:-8080}"