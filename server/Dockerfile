# Dockerfile for web server - development environment

ARG ARCH
FROM ${ARCH}node:10.8.0-stretch

# Nodemon is used to watch changes to the server code and restart it
RUN npm install -g nodemon

# The code is a bind mount, need to create the path
RUN mkdir -p /usr/src/app

# Executing server with nodeamon
CMD nodemon /usr/src/app -- "$WEB_PORT" "$DB_PORT"
