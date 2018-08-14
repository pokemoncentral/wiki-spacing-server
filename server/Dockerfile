# Dockerfile for web server - development environment

ARG ARCH
FROM ${ARCH}node:10.8.0-stretch

# Nodemon is used to watch changes to the server code and restart it.
RUN npm install -g nodemon wait-for

# Wait-for is used to wait for the server. Netcat is a dependency.
RUN apt-get update && apt-get install -y netcat
RUN git clone 'https://github.com/eficode/wait-for.git' /wait-for
RUN cp /wait-for/wait-for /usr/local/bin/wait-for
RUN rm -rf /wait-for
RUN chmod +x /usr/local/bin/wait-for

# The code is a bind mount, need to create the path
RUN mkdir -p /usr/src/app

# This is necessary in order to expand $DB_PORT in the entrypoint
RUN echo 'wait-for db:$DB_PORT -- "$@"' > /entrypoint.sh

# Waiting for database
ENTRYPOINT ["bash", "/entrypoint.sh"]

# Executing server with nodeamon
CMD ["nodemon", "/usr/src/app", "--", "$WEB_PORT", "$DB_PORT"]
