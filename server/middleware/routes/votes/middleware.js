/**
 * @fileoverview This file contains the middleware for the /votes routes.
 *
 * Created by Davide on 8/18/18.
 */

const koaCompose = require('koa-compose');

const { validateVote } = require('../../../lib/validate-vote');

/**
 * This middleware moves the vote from the body to the context, on key 'vote'.
 * The name is taken from the URL parameter 'voter'.
 *
 * @summary Middleware to add the vote to the context.
 */
const add = async (ctx, next) => {
    ctx.vote = ctx.request.body;
    ctx.vote.name = decodeURIComponent(ctx.params.voter);
    await next();
};

/**
 * This middleware validates the vote in the context. If the vote is not valid,
 * throws a 400 error, reporting the invalid sizes with key 'invalidSizes'.
 *
 * @summary Validation middleware for the vote.
 */
const validate = async (ctx, next) => {
    const invalidSizes = validateVote(ctx.vote);

    if (invalidSizes.length > 0) {
        ctx.throw(400, 'Invalid sizes', {body: {invalidSizes}});
    }

    await next();
};

/**
 * This middleware adds the missing properties to the context vote, binding
 * them to null values.
 *
 * @summary Middleware patching the missing property of the vote with null.
 */
const addMissingSizes = async (ctx, next) => {
    /*
        Every call needs a new object, since Object.assign modifies its first
        argument in-place.
    */
    const emptyVote = {
        tiny: null,
        small: null,
        medium: null,
        large: null,
        huge: null
    };
    ctx.vote = Object.assign(emptyVote, ctx.vote);

    await next();
};

/**
 * This function returns a middleware function that adds to the context the
 * passed votes table manager, with key db.
 *
 * @summary A middleware adding the passed vote table manager.
 *
 * @param {VoteTableManager} DbClass - The vote table manager.
 * @return {function} A middleware adding an object to work with the database.
 */
const db = DbClass => async (ctx, next) => {
    DbClass.connect();
    ctx.db = DbClass;

    await next();
};

/**
 * This middleware throws a 404 error if the body evaluates to false, assuming
 * the reason to be a non-existing user passed as 'voter' URL parameter.
 *
 * @summary Middleware throwing a 404 for empty bodies assuming missing voters.
 */
const noUser = async (ctx, next) => {
    if (!ctx.body) {
        ctx.throw(404, 'User not found', {body: {user: ctx.params.voter}});
    }

    await next();
};

module.exports = {
    db,
    noUser: noUser,

    withVote: koaCompose([
        add,
        validate
    ]),

    withFullVote: koaCompose([
        add,
        validate,
        addMissingSizes
    ])
};
