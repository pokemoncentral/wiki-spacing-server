ARG ARCH
FROM ${ARCH}node:10.8.0-stretch

RUN npm install -g nodemon

RUN mkdir -p /usr/src/app

CMD nodemon /usr/src/app -- "$WEB_PORT" "$DB_PORT"
