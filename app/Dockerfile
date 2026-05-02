FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip nodejs npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy source
COPY . /var/www/html

# Install PHP dependencies (production)
RUN composer install --optimize-autoloader --no-dev --no-interaction

# Verify auth pages are present in the build context before bundling
RUN test -f /var/www/html/resources/js/Pages/auth/login.tsx \
    && echo "✓ Auth login page found in build context" \
    || (echo "✗ Missing resources/js/Pages/auth/login.tsx in build context" && exit 1)

# Install JS dependencies and build assets
RUN npm ci && npm run build && rm -rf node_modules

# Verify the client bundle includes the auth page map used by Inertia
RUN grep -R "Pages/auth/login" /var/www/html/public/build/assets >/dev/null \
    && echo "✓ Auth login page found in built assets" \
    || (echo "✗ Auth login page missing from built assets" && exit 1)

# Verify Vite manifest was generated
RUN test -f /var/www/html/public/build/manifest.json \
    && echo "✓ Vite manifest found" \
    || (echo "✗ Vite manifest MISSING - build failed" && exit 1)

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Railway injects $PORT at runtime — start.sh uses it
EXPOSE 8080
CMD ["/bin/sh", "/var/www/html/start.sh"]