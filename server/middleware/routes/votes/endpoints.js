/**
 * @fileoverview
 *
 * Created by Davide on 9/26/18.
 */

const middleware = require('./middleware');

/**
 * This middleware is meant for the collection GET endpoint, that is to
 * retrieves all the votes from the database. If there are none, responds with
 * a 204.
 *
 * @summary Middleware for the collection GET endpoint.
 */
const getAll = async (ctx, next) => {
    const votes = await ctx.db.get();

    if (votes.length > 0) {
        ctx.body = votes;
    }
    else {
        ctx.status = 204;
        ctx.body = {}
    }

    await next();
};

/**
 * This middleware implements the element GET endpoint. it fetches the vote
 * whose voter's name is given in the URL as 'voter' parameter.
 *
 * @summary Middleware for the element GET endpoint.
 */
const getOne = async (ctx, next) => {
    ctx.body = await ctx.db.get(ctx.params.voter);

    await next();
};

/**
 * This middleware serves as the PATCH endpoint for a single element. This
 * implies that it only changes the given properties of a single vote, whose
 * voter has the name indicated in the 'voter' URL parameter. Returns the full
 * vote after the update.
 *
 * @summary Middleware for the element PATCH endpoint.
 */
const patchOne = async (ctx, next) => {
    const result = await ctx.db.update(ctx.vote);
    const vote = result.result[0];

    // Preventing errors due to indexing undefined values with hey 'name'
    if (vote) {
        delete vote.name;
    }

    ctx.body = vote;

    await next();
};

/**
 * This middleware is meant for the PUT endpoint for single votes, that is it
 * entirely replaces the vote indicated by the 'voters' URL parameter, or it
 * creates such vote if it doesn't exist yet. The vote is assumed to already
 * contain all the properties. It responds with a 201 if the vote is newly
 * created, or with a 204 if it is modified.
 *
 * @summary Middleware for the element PUT endpoint.
 */
const putOne = async (ctx, next) => {
    const result = await ctx.db.replace(ctx.vote);

    ctx.status = result.created ? 201 : 204;
    delete ctx.body;

    await next();
};

module.exports = {
    getAll: [getAll],

    getOne: [
        getOne,
        ...middleware.noUser
    ],

    patchOne: [
        ...middleware.withVote,
        patchOne,
        ...middleware.noUser
    ],

    putOne: [
        ...middleware.withFullVote,
        putOne
    ]
};
