/**
 * @fileoverview
 *
 * Created by Davide on 8/12/18.
 */
 
const Koa = require('koa');

const app = new Koa();

const args = process.argv.map(a => parseInt(a.trim()));
const PORT = args[2];
const DB_PORT = args[3];

app.use(async ctx => {
    ctx.body = 'It works\n'
});

module.exports = app.listen(PORT);
