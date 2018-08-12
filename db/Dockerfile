ARG ARCH
FROM ${ARCH}postgres:10.4-alpine

COPY ./initdb.sql /docker-entrypoint-initdb.d
