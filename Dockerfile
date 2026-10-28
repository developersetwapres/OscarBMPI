# Build frontend React/Vite + Laravel
FROM php:8.5.12-cli-alpine AS frontend

RUN apk add --no-cache nodejs npm icu-libs libzip libpng libjpeg-turbo freetype oniguruma icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev $PHPIZE_DEPS && docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install -j"$(nproc)" bcmath exif gd intl mbstring pcntl pdo_mysql zip

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app

COPY src/ ./

RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

RUN npm ci

COPY config/.env /app/.env

RUN npm run build


# Laravel 13 + PHP-FPM + Nginx
FROM php:8.5.12-fpm-alpine

LABEL Maintainer="Pusat Pengembangan dan Layanan Sistem Informasi <setnegapps@setneg.go.id>"

RUN apk add --no-cache nginx supervisor icu-libs libzip libpng libjpeg-turbo freetype oniguruma icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev $PHPIZE_DEPS && docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install -j"$(nproc)" bcmath exif gd intl mbstring pcntl pdo_mysql zip && apk del $PHPIZE_DEPS icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www

COPY src/ ./

RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

COPY --from=frontend /app/public/build/ /var/www/public/build/

COPY config/.env /var/www/.env
COPY config/fpm-pool.conf /usr/local/etc/php-fpm.d/www.conf
COPY config/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/supervisord.conf /etc/supervisord.conf

RUN mkdir -p /run /var/log/supervisor && chown -R www-data:www-data storage bootstrap/cache && chmod -R ug+rwx storage bootstrap/cache

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]