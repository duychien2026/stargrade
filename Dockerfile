FROM php:8.3-cli-alpine

WORKDIR /app
COPY . .
RUN mkdir -p storage && chmod 775 storage

ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT} -t public"]
