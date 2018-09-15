///**
// * @fileoverview This file contains the database-related code. In particular,
// * a class to operate the database and relative Errors.
// *
// * Created by Davide on 8/13/18.
// */
//
//const knex = require('knex');
//const type = require('type-detect');
//
///**
// * This class interacts with the database. In particular:
// * <ul>
// *     <li>It encapsulates the queries in methods.</li>
// *     <li>It remaps meaningful errors to custom exceptions.</li>
// * </ul>
// */
//class DB {
//
//    /**
//     * This is an object suitable to be used as argument for knex.select().
//     * It projects the aggregation of the 'name' column as 'voters'.
//     *
//     * @summary Knex select object with a name-aggregating projection.
//     * @type {Object}
//     */
//    this.collectNames = {
//        voters: this.knex.raw('array_agg(name)')
//    };
//
//    /**
//     * This method returns a query that groups non-null values of a certain
//     * size, projecting the value, the size and the collection of the names
//     * who voted for that size.
//     *
//     * The query is not returned directly, but rather wrapped in a function,
//     * since it is meant to be used as argument for the knex.union() method.
//     * This is not achieved by using .bind() to partially apply the size name
//     * in order to avoid binding this in the knex.union() callback.
//     *
//     * @private
//     * @summary Returns a function that queries for the aggregation of values
//     * of the passed size.
//     *
//     * @param {string} sizeName - The name of the size whose values will be
//     *      grouped.
//     * @return {function(): Promise} A function that wraps the returned query.
//     */
//    _getValue(sizeName) {
//        const projection = Object.assign({
//                // Using raw to select a constant string.
//                size: this.knex.raw(`'${ sizeName }'`),
//                value: sizeName
//            }, this.collectNames);
//
//        return function() {
//            return this.select(projection)
//                       .from('votes')
//                       .whereNotNull(sizeName)
//                       .groupBy(sizeName);
//        }
//    }
//
//    /**
//     * This method returns a query containing all the votes. These are grouped
//     * by value, and associated with the size name and the list of voter names
//     * who voted for the value. They are sorted by descending size name.
//     *
//     * @summary Returns all the votes, grouped by value, with size and voter
//     *      names.
//     * @return {Promise} The aforementioned query containing all the votes.
//     */
//    getAllVotes() {
//        return this.knex.union(DB.sizes.map(this._getValue.bind(this)))
//                        .orderBy('size', 'desc')
//                        .orderBy('value')
//                        .catch(DB._makeError);
//    }
//
//    /**
//     * @summary Returns the Vote of the passed voter.
//     *
//     * @param {string} voter - The Voter whose vote will be returned.
//     * @return {Promise} The Vote of the passed user.
//     */
//    getVote(voter) {
//        return this.knex.first()
//                        .from('votes')
//                        .where('name', voter)
//                        .catch(DB._makeError);
//    }
//
//    /**
//     * This method inserts a new vote in the database. All the sizes are
//     * necessary. The result object returned by the database is augmented with
//     * a created property set to true.
//     *
//     * @summary Adds a new vote to the database.
//     *
//     * @param {Vote} vote - The vote to be added.
//     * @return {Promise} The database result object, with an additional
//     *      'created' key set to true.
//     */
//    insertVote(vote) {
//        return this.knex.insert(vote)
//                        .into('votes')
//                        .returning('name')
//                        .then(DB._setCreated(true))
//                        .catch(DB._makeError);
//    }
//
//    /**
//     * This method either modifies or adds a new vote, the former when a vote
//     * with the same vote exists, the latter when it does not. In the former
//     * case, the result will have its 'created' key set to true, in the latter
//     * to false.
//     *
//     * @summary Modifies an existing vote, or adds a new one.
//     *
//     * @param {Vote} vote - The vote to be modified or added.
//     * @return {Promise} The database result object, with an additional
//     *      'created' key indicating whether the vote has been newly created.
//     */
//    async replaceVote(vote) {
//        const dbVote = await this.getVote(vote.name);
//        return await (dbVote ? this.updateVote(vote) : this.insertVote(vote));
//    }
//
//    /**
//     * This methods modifies a vote in the database. Only the provided sizes
//     * will be overwritten. The result object returned by the database is
//     * augmented with a created property set to false.
//     *
//     * @summary Updates a vote in the database.
//     *
//     * @param {Vote} vote - The vote to be added.
//     * @return {Promise} The database result object, with an additional
//     *      'created' key set to false.
//     */
//    updateVote(vote) {
//        return this.knex.update(vote)
//                        .from('votes')
//                        .where('name', vote.name)
//                        .returning('*')
//                        .then(DB._setCreated(false))
//                        .catch(DB._makeError);
//    }
//}
//
///**
// * @summary Size names in a Vote object.
// * @type {string[]}
// */
//DB.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
//
//
//
//
//
//module.exports = {
//    DB: createDB,
//    DBError,
//    MissingColumnError
//};
