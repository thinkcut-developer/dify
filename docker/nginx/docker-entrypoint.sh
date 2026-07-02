#!/bin/bash

HTTPS_CONFIG=''

wait_for_upstream() {
    local host="$1"
    local port="$2"
    local name="$3"
    local attempts="${NGINX_UPSTREAM_WAIT_ATTEMPTS:-60}"
    local interval="${NGINX_UPSTREAM_WAIT_INTERVAL:-2}"

    for ((i=1; i<=attempts; i++)); do
        if (echo >"/dev/tcp/${host}/${port}") >/dev/null 2>&1; then
            echo "${name} upstream is ready at ${host}:${port}"
            return 0
        fi
        echo "Waiting for ${name} upstream (${host}:${port})... (${i}/${attempts})"
        sleep "${interval}"
    done

    echo "Warning: ${name} upstream did not become ready in time (${host}:${port}). Continuing startup."
    return 1
}

if [ "${NGINX_HTTPS_ENABLED}" = "true" ]; then
    # Check if the certificate and key files for the specified domain exist
    if [ -n "${CERTBOT_DOMAIN}" ] && \
       [ -f "/etc/letsencrypt/live/${CERTBOT_DOMAIN}/${NGINX_SSL_CERT_FILENAME}" ] && \
       [ -f "/etc/letsencrypt/live/${CERTBOT_DOMAIN}/${NGINX_SSL_CERT_KEY_FILENAME}" ]; then
        SSL_CERTIFICATE_PATH="/etc/letsencrypt/live/${CERTBOT_DOMAIN}/${NGINX_SSL_CERT_FILENAME}"
        SSL_CERTIFICATE_KEY_PATH="/etc/letsencrypt/live/${CERTBOT_DOMAIN}/${NGINX_SSL_CERT_KEY_FILENAME}"
    else
        SSL_CERTIFICATE_PATH="/etc/ssl/${NGINX_SSL_CERT_FILENAME}"
        SSL_CERTIFICATE_KEY_PATH="/etc/ssl/${NGINX_SSL_CERT_KEY_FILENAME}"
    fi
    export SSL_CERTIFICATE_PATH
    export SSL_CERTIFICATE_KEY_PATH

    # set the HTTPS_CONFIG environment variable to the content of the https.conf.template
    HTTPS_CONFIG=$(envsubst < /etc/nginx/https.conf.template)
    export HTTPS_CONFIG
    # Substitute the HTTPS_CONFIG in the default.conf.template with content from https.conf.template
    envsubst '${HTTPS_CONFIG}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi
export HTTPS_CONFIG

if [ "${NGINX_ENABLE_CERTBOT_CHALLENGE}" = "true" ]; then
    ACME_CHALLENGE_LOCATION='location /.well-known/acme-challenge/ { root /var/www/html; }'
else
    ACME_CHALLENGE_LOCATION=''
fi
export ACME_CHALLENGE_LOCATION

env_vars=$(printenv | cut -d= -f1 | sed 's/^/$/g' | paste -sd, -)

envsubst "$env_vars" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
envsubst "$env_vars" < /etc/nginx/proxy.conf.template > /etc/nginx/proxy.conf

envsubst "$env_vars" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

if [ "${NGINX_WAIT_FOR_UPSTREAMS:-true}" = "true" ]; then
    wait_for_upstream "api" "5001" "API" || true
    wait_for_upstream "web" "3000" "Web" || true
fi

# Start Nginx using the default entrypoint
exec nginx -g 'daemon off;'
