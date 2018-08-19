/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */
 
const Router = require('koa-router');

const withVote = require('./middleware');

const router = new Router({
    prefix: '/votes'
});

router.get('/groups', async (ctx, next) => {
    ctx.body = await ctx.db.getAllVotes();
    await next();
});

router.put('/:voter', withVote, async (ctx, next) => {
    const result = await ctx.db.replaceVote(ctx.vote);

    ctx.status = result.created ? 201 : 204;
    delete ctx.body;
    await next();
});

module.exports = router;
