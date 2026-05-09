# =========================
# 1. BUILD PHP (COMPOSER)
# =========================
FROM php:8.4-cli-alpine3.21 AS composer_build

WORKDIR /app

RUN apk add --no-cache git unzip
COPY --from=composer:2.8.8 /usr/bin/composer /usr/local/bin/composer

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-interaction
RUN php artisan wayfinder:generate --with-form


# =========================
# 2. BUILD FRONTEND (NODE)
# =========================
FROM node:22-alpine3.21 AS node_build

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
COPY --from=composer_build /app/resources/js/actions ./resources/js/actions
COPY --from=composer_build /app/resources/js/routes ./resources/js/routes
COPY --from=composer_build /app/resources/js/wayfinder ./resources/js/wayfinder

RUN export WAYFINDER_COMMAND="sh -c 'exit 0' sh" \
    && npm run build


# =========================
# 3. RUNTIME (PHP)
# =========================
FROM php:8.4-fpm-alpine3.21

WORKDIR /var/www/html

# Runtime deps + extensiones PHP minimizando paquetes persistentes
RUN apk add --no-cache icu-libs libzip tini \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql intl zip opcache pcntl \
    && apk del .build-deps

# Copy backend and frontend build
COPY --from=composer_build /app /var/www/html
COPY --from=node_build /app/public/build /var/www/html/public/build

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Laravel cache cleanup
RUN php artisan config:clear || true \
    && php artisan route:clear || true \
    && php artisan view:clear || true

USER www-data

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]