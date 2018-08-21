/**
 * @fileoverview This file aggregates the top-level middleware and routes.
 *
 * Created by Davide on 8/18/18.
 */
 
const bodyParser = require('koa-bodyparser');
const koaCompose = require('koa-compose');

const db = require('./db');
const error = require('./error');
const voteRoutes = require('./routes/votes');

/**
 * This function uses koa-compose to aggregate top-level middlewares. The
 * parameters are passed to the middlewares needing them.
 *
 * @summary Retuns the aggregation of top-level middelwares.
 *
 * @param {object} args - Named arguments wrapper.
 * @param {int} args.dbPort - The database server port.
 * @returns {Function} The composition of all the top-level middlwrares.
 */
module.exports = args => koaCompose([
    error.middleware,
    bodyParser({onerror: error.bodyParser}),
    db(args.dbPort),
    voteRoutes.routes(),
    voteRoutes.allowedMethods()
]);

