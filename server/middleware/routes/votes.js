/**
 * @fileoverview
 *
 * Created by Davide on 8/18/18.
 */
 
const Router = require('koa-router');

const router = new Router();

router.get('/votes/groups', async (ctx, next) => {
    ctx.body = await ctx.db.getAllVotes();
    await next();
});

router.put('/votes/:voter', async (ctx, next) => {
    const vote = ctx.request.body;
    ctx.body = await ctx.db.replaceVote(vote);
    await next();
});

module.exports = router;
