#!/usr/bin/env bash

export DB_PORT=32460
export WEB_PORT=29004

EXTRA_COMPOSE_FILE=''
while getopts ':E' OPTION; do
    case "$OPTION" in
        'E')
            EXTRA_COMPOSE_FILE="-f compose-\"$OPTARG\".yaml"
            ;;

        *)  # getopts already printed an error message
            exit 1
            ;;
    esac
done
shift $(( OPTIND - 1 ))

exec docker-compose -f compose-dev.yaml $EXTRA_COMPOSE_FILE "$@"
