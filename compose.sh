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

# Database port (defautl value, as the database is unreachable from outside
# the docker network)
export DB_PORT=5432

# Web server port on docker network
export WEB_PORT=29004

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
