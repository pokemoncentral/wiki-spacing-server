#!/usr/bin/env bash

# This script is meant as a wrapper for docker-compose, in order to do some
# setup first. It uses by default the compose-dev.yaml file, but other
# configurations can be added on top of it via the -E flag as described below.
#
# Arguments:
#   - E [ prod | test ]: The environment for which docker-compose should be
#       run. Selects one additional compose-*.yaml file.
#   - C [ local | prod ]: The certificate to use, localhost vs production.
#       If not given, will use 'local' if E is 'dev' or 'test', 'prod'
#       otherwise.
#   - $@: Anything that docker-compose accepts.

###################################################
#
#               Exporting variables
#
###################################################

# Database port (default value, as the database is unreachable from outside
# the docker network)
export DB_PORT=5432

# Web server port on docker network
export WEB_PORT=29004

# Different architectures need different docker base images
case "$(uname -m)" in
    'x86_64')
        export DB_IMAGE='postgres:10.5-alpine'
        export WEB_IMAGE='node:10.8.0-alpine'
        ;;

    'armv7l')
        export DB_IMAGE='arm32v7/postgres:10.5'
        export WEB_IMAGE='arm32v7/node:10.8.0-stretch'
        ;;
esac

# Production environemnt is slow
export COMPOSE_HTTP_TIMEOUT=300

###################################################
#
#               Input processing
#
###################################################

ENVIRONMENT='dev'
CERT=''
EXTRA_COMPOSE_FILE=''
while getopts 'E:' OPTION; do
    case "$OPTION" in
        'P')
            CERT="$OPTARG"
            ;;

        'E')
            ENVIRONMENT="$OPTARG"
            EXTRA_COMPOSE_FILE="-f compose-$OPTARG.yaml"
            ;;

        *)  # getopts already printed an error message
            exit 1
            ;;
    esac
done
shift $(( OPTIND - 1 ))

if [[ -z "$CERT" ]]; then
    case "$ENVIRONMENT" in
        dev|test)
            CERT='local'
            ;;

        prod)
            CERT='prod'
            ;;
    esac
fi

###################################################
#
#                   TSL
#
###################################################

# Certificates and keys are symbolic links, which are known not to work
# in docker. Therefore they are copied in the docker build context of
# the server, so that they are available from inside the container.

mkdir -p server/tsl

case "$CERT" in
    'local')
        CERT_FILE='/etc/ssl/localcerts/localhost.crt'
        KEY_FILE='/etc/ssl/localcerts/localhost.key'
        CERT_DOMAIN='localhost'
        ;;

    'prod')
        CERT_FILE='/etc/letsencrypt/live/maze0.hunnur.com/cert.pem'
        KEY_FILE='/etc/letsencrypt/live/maze0.hunnur.com/privkey.pem'
        CERT_DOMAIN='maze0.hunnur.com'
        ;;
esac

ACTIVE_DOMAIN="$(openssl x509 -noout -in "$CERT_FILE" -subject \
    | cut -d' ' -f3)"
if ! find server/tsl/ -type f &> /dev/null \
        || [[ "$ACTIVE_DOMAIN" != "$CERT_DOMAIN" ]]; then
    rm -rf server/tsl/*
    sudo bash -c "cp \"$CERT_FILE\" server/tsl/cert.pem"
    sudo bash -c "cp \"$KEY_FILE\" server/tsl/privkey.pem"
    sudo bash -c "chown \"$USER\":\"$USER\" server/tsl/*"
fi

###################################################
#
#           Invoking docker compose
#
###################################################

exec docker-compose -f compose-dev.yaml $EXTRA_COMPOSE_FILE "$@"
