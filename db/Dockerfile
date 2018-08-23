# Dockerfile for database server

ARG DB_IMAGE
FROM ${DB_IMAGE}

# Copying initialization script to image initialization directory
COPY ./initdb.sql /docker-entrypoint-initdb.d
