/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */

const koaCompose = require('koa-compose');

const { DBError } = require('../lib/db');

const makeErrorMiddleware = handler => async (ctx, next) => {
    try {
        await next();
    }
    catch (error) {
        handler(ctx, error, next);
    }
};

const catchAll = makeErrorMiddleware((ctx, error) => {
    const msg = error.message || 'Internal server error';

    ctx.status = error.status || 500;
    ctx.body = Object.assign({error: msg}, error.body);
});

const catchDB = makeErrorMiddleware((ctx, error) => {
    if (!(error instanceof DBError)) {
        throw error;
    }

    ctx.status = 400;
    console.log(error.message);
    ctx.body = Object.assign({error: error.message}, error.error);
});

module.exports = koaCompose([
    catchAll,
    catchDB
]);
