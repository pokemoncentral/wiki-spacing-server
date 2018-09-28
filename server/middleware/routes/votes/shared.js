/**
 * @fileoverview This file contains utility functions used by all /votes
 * subroutes.
 *
 * Created by Davide on 9/26/18.
 */

const koaCompose = require('koa-compose');
const mapValues = require('lodash/mapValues');
const Router = require('koa-router');

const endpoints = require('./endpoints');
const { db } = require('./middleware');

/**
 * This function adds the db middleware from the middleware modules to all the
 * passed middlewares. The db middleware is constructed with the given votes
 * table manager.
 *
 * @summary Adds the db middleware to all the passed middlewares.
 *
 * @param {VoteTableManager} DbClass - The vote table manager to be used by
 *      the db middleware.
 * @param {object} [middlewares=endpoints] - Object whose keys are the
 *      middlewares. Defaults to the endpoints module.
 * @return {object} An object like the input, but whose values have been
 *      augmented with the db middleware.
 */
const addDb = (DbClass, middlewares = endpoints) => {
    const dbMiddleware = db(DbClass);
    return mapValues(middlewares, middleware => koaCompose([
        dbMiddleware,
        middleware
    ]));
};

/**
 * This function returns a router for the standard /vote endpoints, binding
 * them to middlewares found at specific keys in the routes argument,
 * the following way:
 * <ul>
 *     <li>GET / -- endpoints.getAll</li>
 *     <li>GET /:vote -- endpoints.getOne</li>
 *     <li>PATCH /:vote -- endpoints.patchOne</li>
 *     <li>PUT /:vote -- endpoints.putOne</li>
 * </ul>
 *
 * A vote table manager can be provided, that will be used to prepend the
 * db middleware to all the middleware in the routes.
 *
 * If a router is provided, the routes will be added to that. If a string is
 * provided as a router, the returned router will have that as a prefix.
 *
 * @summary Returns a Router with the standard /vote endpoints.
 *
 * @param {VoteTableManager} [DbClass] - The vote table manager to be used to
 *      prepend the db middleware to all middlewares in routes.
 * @param {Router|string} [router] - The router the routes will be added to,
 *      or a string to be used as the prefix for the new router.
 * @param {object} [routes=endpoints] - The middlewares to be added as routes.
 *      Their keys are specified above. Defaults to the endpoints module.
 * @return {Router} A Router with the standard /votes routes.
 */
const makeRoutes = (DbClass = null, router = null, routes = endpoints) => {
    if (DbClass) {
        routes = addDb(DbClass, routes);
    }

    if (!router) {
        router = new Router();
    }
    else if (typeof(router) === 'string') {
        router = new Router({
            prefix: router
        });
    }

    router.get('/', routes.getAll)
          .get('/:voter', routes.getOne)
          .patch('/:voter', routes.patchOne)
          .put('/:voter', routes.putOne);

    return router;
};

module.exports = {
    addDb,
    makeRoutes
};
