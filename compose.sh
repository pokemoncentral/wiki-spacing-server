#!/usr/bin/env bash

# This script is meant as a wrapper for docker-compose, in order to export some
# environment variables first. It uses by default the compose-dev.yaml file,
# but other configurations can be added on top of it via the -E flag as
# described below.
#
# Arguments:
#   - E [ prod | test ]: The environment for which docker-compose should be
#       run. Selects one additional compose-*.yaml file.
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

EXTRA_COMPOSE_FILE=''
while getopts 'E:' OPTION; do
    case "$OPTION" in
        'E')
            EXTRA_COMPOSE_FILE="-f compose-$OPTARG.yaml"
            ;;

        *)  # getopts already printed an error message
            exit 1
            ;;
    esac
done
shift $(( OPTIND - 1 ))

###################################################
#
#           Invoking docker compose
#
###################################################

exec docker-compose -f compose-dev.yaml $EXTRA_COMPOSE_FILE "$@"
