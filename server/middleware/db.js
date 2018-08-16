/**
 * @fileoverview This module exports a middleware function that adds to the
 * context an object to interact with the database.
 *
 * Created by Davide on 8/16/18.
 */

const { DB } = require('../lib/db.js');

/**
 * This function returns a middleware function that adds to the context an
 * object useful to work with the database. The key of such object is db.
 *
 * @summary A middleware adding a database-manipulating object, parametrized
 * by the database port.
 *
 * @param port {number} - The database port.
 * @return {Function} A middleware adding an object to work with the database.
 */

module.exports = port => async (ctx, next) => {
    ctx.db = new DB(port);
    await next();
};
