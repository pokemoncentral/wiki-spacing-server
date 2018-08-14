/**
 * @fileoverview This file contains the cote that accesses the database.
 * It exports a middleware that adds an object to operate the database.
 *
 * Created by Davide on 8/13/18.
 */

const knex = require('knex');
const type = require('type-detect');

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
            names: this.knex.raw('array_agg(name)')
        };

        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    }


    /**
     * Returns another function to avoid binding this
     *
     * @param valueName
     * @returns {function(): *}
     * @private
     */
    _getValue(valueName) {
        const projection = Object.assign({
                size: this.knex.raw(`'${ valueName }'`),
                value: valueName
            }, this.collectNames);

        return function() {
            return this.select(projection)
                       .from('votes')
                       .groupBy(valueName);
        }
    }

    /**
     * Returns another function to avoid binding this
     *
     * @param created
     * @return {function(*): *}
     *
     * @private
     */
    static _setCreated(created) {
        return function(result) {
            const target = type(result) === 'Object' ? result : {result};
            target.created = created;
            return target;
        };
    }

    getAllVotes() {
        return this.knex.union(this.sizes.map(this._getValue.bind(this)))
                        .orderBy('size', 'desc')
                        .orderBy('value');
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
                        .then(DB._setCreated(true));
    }

    async replaceVote(vote) {
        const dbVote = await this.getVote(vote.name);
        return dbVote ? this.updateVote(vote) : this.insertVote(vote);
    }

    updateVote(vote) {
        return this.knex.update(vote)
                        .from('votes')
                        .where('name', vote.name)
                        .returning('name')
                        .then(DB._setCreated(false));
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
