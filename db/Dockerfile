# Dockerfile for database server

ARG ARCH
FROM ${ARCH}postgres:10.5

# Copying initialization script to image initialization directory
COPY ./initdb.sql /docker-entrypoint-initdb.d
