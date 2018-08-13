/**
 * @fileoverview This file contains the cote that accesses the database.
 * It exports a middleware that adds an object to operate the database.
 *
 * Created by Davide on 8/13/18.
 */

const knex = require('knex');

/**
 *
 */
class DB {
    constructor(port) {
        this.knex = knex({
            client: 'pg',
            version: '10.5',
            connection: {
                host: 'db',
                port: port,
                user: 'wiki',
            database: 'spacing'
            },
        })
    }

    votes() {
        return this.knex.select().table('votes');
    }
}

/**
 * This function returns a middleware function, that adds to the context an
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
