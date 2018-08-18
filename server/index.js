/**
 * @fileoverview This is the entry point of the server.
 *
 * Created by Davide on 8/12/18.
 */

const Koa = require('koa');

const middlewares = require('./middleware');

const app = new Koa();

/**
 * This type represents a vote for spacing values.
 *
 * @typedef {Object} Vote
 * @property {string} name - The name of the voter.
 * @property {string} tiny - The value for tiny spacing.
 * @property {string} small - The value for small spacing.
 * @property {string} medium - The value for medium spacing.
 * @property {string} large - The value for large spacing.
 * @property {string} huge - The value for huge spacing.
 */

// Processing arguments
const args = process.argv.map(a => parseInt(a.trim()));
const PORT = args[2];
const DB_PORT = args[3];

app.use(middlewares({
    dbPort: DB_PORT
}));

module.exports = app.listen(PORT);
