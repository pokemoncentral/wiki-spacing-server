/**
 * @fileoverview This is the entrypoint of the server.
 *
 * Created by Davide on 8/12/18.
 */

const Koa = require('koa');

const db = require('./lib/db.js');

const app = new Koa();

// Processing arguments
const args = process.argv.map(a => parseInt(a.trim()));
const PORT = args[2];
const DB_PORT = args[3];

app.use(db.middleware(DB_PORT));

app.use(async ctx => {
    ctx.body = 'It works\n';
    // await ctx.db.getAllVotes();
});

module.exports = app.listen(PORT);
