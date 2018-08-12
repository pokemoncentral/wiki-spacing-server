#!/usr/bin/env bash

case $(uname -m) in
    'x86_64')
        ARCH=''
        ;;

    'armv7l')
        ARCH='arm32v7/'
        ;;
    *)
        ARCH=''
        ;;
esac

export ARCH
docker-compose up
