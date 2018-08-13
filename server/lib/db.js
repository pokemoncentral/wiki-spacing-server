/**
 * @fileoverview
 *
 * Created by Davide on 8/13/18.
 */

const knex = require('knex');

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

module.exports = port => async (ctx, next) => {
    ctx.db = new DB(port);
    await next();
};
