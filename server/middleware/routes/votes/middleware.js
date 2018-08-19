/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */

const koaCompose = require('koa-compose');

const { validateVote } = require('../../../lib/validate-vote');

const add = async (ctx, next) => {
    // is it valid json?
    ctx.vote = ctx.request.body;
    ctx.vote.name = decodeURIComponent(ctx.params.voter);
    await next();
};

const validate = async (ctx, next) => {
    const invalidSizes = validateVote(ctx.vote);

    if (invalidSizes.length > 0) {
        ctx.throw(400, 'Invalid sizes', {body: {invalidSizes}});
    }

    await next();
};


const addMissingSizes = async (ctx, next) => {
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

const noUser = async (ctx, next) => {
    if (!ctx.body) {
        ctx.throw(404, 'User not found', {body: {user: ctx.params.voter}});
    }

    await next();
};

module.exports = {
    noUser,

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
