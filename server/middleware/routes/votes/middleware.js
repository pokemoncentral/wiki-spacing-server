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
    ctx.vote.name = ctx.params.voter;
    await next();
};

const validate = async (ctx, next) => {
    const invalidSizes = validateVote(ctx.vote);

    if (invalidSizes.length > 0) {
        ctx.throw(400, 'Invalid sizes', {body: {invalidSizes}});
    }

    await next();
};

module.exports = koaCompose([
    add,
    validate
]);
