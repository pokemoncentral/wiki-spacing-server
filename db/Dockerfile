# Dockerfile for database server

ARG ARCH
FROM ${ARCH}postgres:10.4-alpine

# Copying initialization script to image initialization directory
COPY ./initdb.sql /docker-entrypoint-initdb.d
