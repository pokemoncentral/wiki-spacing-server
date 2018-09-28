/**
 * @fileoverview This file aggregates the top-level middleware and routes.
 *
 * Created by Davide on 8/18/18.
 */
 
const bodyParser = require('koa-bodyparser');
const cors = require('koa2-cors');
const koaCompose = require('koa-compose');

const error = require('./error');
const routes = require('./routes');

module.exports = koaCompose([
    cors(),
    error.middleware,
    bodyParser({onerror: error.bodyParser}),
    routes
]);

