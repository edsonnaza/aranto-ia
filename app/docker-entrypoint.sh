#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for MySQL..."
for i in $(seq 1 30); do
    if nc -z mysql 3306 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    echo "Attempt $i: waiting for MySQL..."
    sleep 2
done

# Run migrations
echo "Running migrations..."
php artisan migrate --force 2>/dev/null || true

# Run seeders
echo "Running seeders..."
php artisan db:seed --force 2>/dev/null || true

# Clear caches
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Database initialization complete!"

# Start the application
exec "$@"
