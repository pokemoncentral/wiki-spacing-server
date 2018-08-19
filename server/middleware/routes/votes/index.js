/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */
 
const Router = require('koa-router');

const middleware = require('./middleware');

const router = new Router({
    prefix: '/votes'
});

router.get('/', async (ctx, next) => {
    const votes = await ctx.db.getAllVotes();

    if (votes.length > 0) {
        ctx.body = votes;
    }
    else {
        ctx.status = 204;
        ctx.body = {}
    }

    await next();
});

router.get('/:voter', async (ctx, next) => {
    ctx.body = await ctx.db.getVote(ctx.params.voter);

    await next();
}, middleware.noUser);

router.patch('/:voter', middleware.withVote, async (ctx, next) => {
    const result = await ctx.db.updateVote(ctx.vote);
    const vote = result.result[0];
    if (vote)
        delete vote.name;

    ctx.body = vote;

    await next();
}, middleware.noUser);

router.put('/:voter', middleware.withFullVote, async (ctx, next) => {
    const result = await ctx.db.replaceVote(ctx.vote);

    ctx.status = result.created ? 201 : 204;
    delete ctx.body;

    await next();
});

module.exports = router;
