/**
 * @fileoverview
 *
 * Created by Davide on 9/26/18.
 */

const mapValues = require('lodash/mapValues');
const Router = require('koa-router');

const endpoints = require('./endpoints');
const { db } = require('./middleware');

const addDb = (DbClass, endpoints = endpoints) => {
    const dbMiddleware = db(DbClass);
    return mapValues(endpoints, middleware =>
        dbMiddleware.concat(middleware));
};

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

    router.get('/', ...routes.getAll)
          .get('/:voter', ...routes.getOne)
          .patch('/:voter', ...routes.patchOne)
          .put('/:voter', ...routes.putOne);

    return [
        router.routes(),
        router.allowedMethods()
    ];
};

module.exports = {
    addDb,
    makeRoutes
};
