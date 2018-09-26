/**
 * @fileoverview This file contains classes that deal with database persistence
 * of votes.
 *
 * Created by Davide on 9/15/18.
 */

const { DB } = require('./db');

/**
 * This class represents an object with utility methods to operate with a
 * single votes table.
 *
 * @summary Class whose instances operate with votes in a certain table.
 */
class VoteTableManager {

    /**
     * Constructs an instance operating on the given table, optionally
     * initializing the database connection if a port is given.
     *
     * @summary Constructs an instance that will query the passed table.
     *
     * @param {string} table - The table used in any subsequent query.
     * @param {int} [port] - The port the database server is listening on.
     */
    constructor(table, port = null) {
        if (port) {
            this.connect(port);
        }
        this.table = table;

        /**
         * @summary Size names in a Vote object.
         * @type {string[]}
         */
        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    }

    /**
     * This method returns a query that groups non-null values of a certain
     * size, projecting the value, the size and the collection of the names
     * who voted for that size.
     *
     * The query is not returned directly, but rather wrapped in a function,
     * since it is meant to be used as argument for the knex.union() method.
     * This is not achieved by using .bind() to partially apply the size name
     * in order to avoid binding this in the knex.union() callback.
     *
     * @private
     * @summary Returns a function that queries for the aggregation of values
     * of the passed size.
     *
     * @param {string} sizeName - The name of the size whose values will be
     *      grouped.
     * @return {function(): Promise} A function that wraps the returned query.
     */
    _getValue(sizeName) {
        const projection = Object.assign({
            // Using raw to select a constant string.
            size: this.db.raw(`'${ sizeName }'`),
            value: sizeName
        }, this.collectNames);

        /*
            The reference to this.table needs to be saved, as this is
            dynamically bound in the returned closure.
        */
        const table = this.table;
        return function() {
            return this.select(projection)
                       .from(table)
                       .whereNotNull(sizeName)
                       .groupBy(sizeName);
        }
    }

    /**
     * @summary This method initializes the database connection.
     *
     * @param {int} [port] - The port the database server is listening on.
     */
    connect(port = null) {
        this.db = DB.getInstance(port);

        /**
         * This is an object suitable to be used as argument for knex.select().
         * It projects the aggregation of the 'name' column as 'voters'.
         *
         * @summary Knex select object with a name-aggregating projection.
         * @type {Object}
         */
        this.collectNames = {
            voters: this.db.raw('array_agg(name)')
        };
    }

    /**
     * This method returns a query that reads votes. If a voter name is passed,
     * its vote only is returned, otherwise all the votes are returned. These
     * are grouped by value, and associated with the size name and the list of
     * voter names who voted for the value. They are sorted by descending size
     * name.
     *
     * @summary Returns the vote of the passed user, or all the votes grouped
     * by value, with size and voter names.
     *
     * @param {string} [voter] - The Voter whose vote will be returned.
     * @return {Promise} The aforementioned query.
     */
    get(voter = null) {
        if (voter) {
            return this.db.first()
                       .from(this.table)
                       .where('name', voter)
                       .catch(this.db.makeError);
        }
        else {
            return this.db.union(this.sizes.map(this._getValue.bind(this)))
                          .orderBy('size', 'desc')
                          .orderBy('value')
                          .catch(this.db.makeError);
        }
    }

    /**
     * This method inserts a new vote in the database. All the sizes are
     * necessary. The result object returned by the database is augmented with
     * a created property set to true.
     *
     * @summary Adds a new vote to the database.
     *
     * @param {Vote} vote - The vote to be added.
     * @return {Promise} The database result object, with an additional
     *      'created' key set to true.
     */
    insert(vote) {
        return this.db.insert(vote)
                      .into(this.table)
                      .returning('name')
                      .then(this.db.setCreated(true))
                      .catch(this.db.makeError);
    }

    /**
     * This method either modifies or adds a new vote, the former when a vote
     * with the same vote exists, the latter when it does not. In the former
     * case, the result will have its 'created' key set to true, in the latter
     * to false.
     *
     * @summary Modifies an existing vote, or adds a new one.
     *
     * @param {Vote} vote - The vote to be modified or added.
     * @return {Promise} The database result object, with an additional
     *      'created' key indicating whether the vote has been newly created.
     */
    async replace(vote) {
        const dbVote = await this.get(vote.name);
        return await (dbVote ? this.update(vote) : this.insert(vote));
    }

    /**
     * This methods modifies a vote in the database. Only the provided sizes
     * will be overwritten. The result object returned by the database is
     * augmented with a created property set to false.
     *
     * @summary Updates a vote in the database.
     *
     * @param {Vote} vote - The vote to be added.
     * @return {Promise} The database result object, with an additional
     *      'created' key set to false.
     */
    update(vote) {
        return this.db.update(vote)
                      .from(this.table)
                      .where('name', vote.name)
                      .returning('*')
                      .then(this.db.setCreated(false))
                      .catch(this.db.makeError);
    }
}

/**
 * @summary VoteTableManager instance working on votes for grid spacing.
 * @type {VoteTableManager}
 */
const GridVote = new VoteTableManager('grid_votes');

/**
 * @summary VoteTableManager instance working on votes for table spacing.
 * @type {VoteTableManager}
 */
const TableVote = new VoteTableManager('table_votes');

module.exports = {
    GridVote,
    TableVote
};
