FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip nodejs npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy source
COPY . /var/www/html

# Install PHP dependencies
RUN composer install --optimize-autoloader --no-dev --no-interaction

# 🔥 GENERAR WAYFINDER (CLAVE)
RUN php artisan wayfinder:generate --with-form || true

# Verify auth pages
RUN test -f /var/www/html/resources/js/Pages/auth/login.tsx \
    && echo "✓ Auth login page found in build context" \
    || (echo "✗ Missing resources/js/Pages/auth/login.tsx in build context" && exit 1)

# Install JS and build
RUN npm ci && npm run build && rm -rf node_modules

# Verify build
RUN test -f /var/www/html/public/build/manifest.json \
    && echo "✓ Vite manifest found" \
    || (echo "✗ Vite manifest MISSING - build failed" && exit 1)

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Railway
EXPOSE 8080
CMD ["/bin/sh", "/var/www/html/start.sh"]