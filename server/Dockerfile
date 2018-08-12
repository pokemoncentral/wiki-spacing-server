ARG ARCH
FROM ${ARCH}node:10.8.0-stretch

RUN npm install -g nodemon

WORKDIR /usr/src/app
RUN npm install

CMD node . -- "$WEB_PORT" "$DB_PORT"
