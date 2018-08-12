/**
 * @fileoverview
 *
 * Created by Davide on 8/12/18.
 */
 
const Koa = require('koa');

const app = new Koa();

app.use(async ctx => {
    ctx.body = 'It works\n'
});

app.listen(29004);
