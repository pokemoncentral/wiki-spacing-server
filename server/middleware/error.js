/**
 * @fileoverview This file contains error-handling functions and middlewares.
 *
 * Created by Davide on 8/18/18.
 */

const koaCompose = require('koa-compose');

const { DBError } = require('../lib/db/db');

/**
 * This function is meant as a callback for the 'onerror' option of the
 * koa-bodyparser module.
 *
 * @summary Callback for koa-bodyparser 'onerror' option.
 *
 * @param {Error} err - Error thrown by koa-bodyparser.
 * @param ctx - The koa context.
 */
const bodyParser = (err, ctx) => {
    ctx.throw(400, 'Bad request', {body: {error: err.message}});
};

/**
 * This function is meant to handle errors thrown by following middlewares. It
 * is called in a catch block, only when the error has actually occurred.
 *
 * @callback errorHandler
 *
 * @param {object} ctx - The koa context object.
 * @param {Error} error - The thrown error.
 * @param {Function} next - The next middleware.
 */

/**
 * This function returns the standard koa error-handling middleware, that
 * try-catches an `await next();` and deals with the error. It calls the
 * provided handler in the catch clause, passing the context, the error and
 * the next middleware.
 *
 * @summary Returns an error-handling middleware.
 *
 * @param {errorHandler} handler - The function that actually handles errors.
 * @return {Function} A standard koa error-handling middleware that handles
 *      errors by executing handler.
 */
const makeErrorMiddleware = handler => async (ctx, next) => {
    try {
        await next();
    }
    catch (error) {
        handler(ctx, error, next);
    }
};

/**
 * This koa error-handling middleware deals with all possible errors, in the
 * following way:
 * <ul>
 *     <li>
 *         Sets the response code to the one of the error, if defined,
 *         otherwise 500.
 *     </li>
 *     <li>
 *         Sets the body to an object with a message property, that contains
 *         the message of the error, or 'Internal server error' if the error
 *         has no message. Additionally, all the properties of the error body
 *         are shallow-copied, if any.
 *     </li>
 * </ul>
 *
 * @summary A generic catch-all koa error-handling middlweare.
 */
const catchAll = makeErrorMiddleware((ctx, error) => {
    const msg = error.message || 'Internal server error';

    ctx.status = error.status || 500;
    ctx.body = Object.assign({error: msg}, error.body);
});

/**
 * This koa error-handling middleware deals with database errors, rethrowing
 * all the other ones. It does the following:
 * <ul>
 *     <li>Sets the response code to 400.</li>
 *     <li>
 *         Sets the body to an object with a message property, containing the
 *         message of the error. Additionally, all the properties of the
 *         wrapped error are shallow-copied.
 *     </li>
 * </ul>
 *
 * @summary A koa error-handling middleware for database errors.
 */
const catchDB = makeErrorMiddleware((ctx, error) => {
    if (!(error instanceof DBError)) {
        throw error;
    }

    ctx.status = 400;
    ctx.body = Object.assign({error: error.message}, error.error);
});

module.exports = {
    bodyParser,

    // Catchall goes first, so that it can catch errors rethrown by catchDB
    middleware: koaCompose([
       catchAll,
       catchDB
   ])
};
