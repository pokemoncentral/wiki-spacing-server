/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */
 
const bodyParser = require('koa-bodyparser');
const koaCompose = require('koa-compose');

const db = require('./db');
const error = require('./error');
const voteRoutes = require('./routes/votes');

module.exports = args => koaCompose([
    bodyParser(),
    error,
    db(args.dbPort),
    voteRoutes.routes(),
    voteRoutes.allowedMethods()
]);
