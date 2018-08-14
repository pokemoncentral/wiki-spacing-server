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
                database: 'spacing',
                host: 'db',
                port: port,
                user: 'wiki'
            },
        });

        this.collectNames = {
            names: this.knex.raw('array_agg(names)')
        };

        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    }

    _getValue(valueName) {
        this.select(Object.assign({
                    size: knex.raw(`'${ valueName }'`),
                    value: valueName
                }, this.collectNames))
            .from('votes');
    }

    getAllVotes() {
        const first = this._getValue.call(this.knex, this.sizes[0]);
        return this.sizes.slice(1).reduce((query, size) =>
                query.union(this._getValue.bind(this.knex, size)), first);
    }

    getVote(user) {
        return this.knex.first()
                        .from('votes')
                        .where('name', user);
    }

    insertVote(vote) {
        return this.knex.insert(vote)
                        .into('votes')
                        .returning('name')
                        .then(res => { return {res, created: true}});
    }

    async replaceVote(vote) {
        const dbVote = await this.getVote(vote.user);
        return dbVote.length > 0
                ? this.updateVote(vote)
                : this.insertVote(vote);
    }

    updateVote(vote) {
        return this.knex.update(vote)
                        .from('votes')
                        .where('name', vote.name)
                        .returning('name')
                        .then(res => { return {res, created: false}});
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
