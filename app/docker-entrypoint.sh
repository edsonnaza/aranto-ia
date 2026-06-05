#!/bin/sh
set -e

# Create required storage directories if they don't exist
echo "Creating storage directories..."
mkdir -p storage/framework/{views,cache,sessions}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Ensure correct permissions
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

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
