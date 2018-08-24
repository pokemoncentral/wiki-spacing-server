/**
 * @fileoverview This is the entry point of the server.
 *
 * Created by Davide on 8/12/18.
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const Koa = require('koa');

const middleware = require('./middleware');

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

app.use(middleware({
    dbPort: DB_PORT
}));

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/maze0.hunnur.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/maze0.hunnur.com/fullchain.pem', 'utf8')
};

const server = https.createServer(options, app.callback());
module.exports = server.listen(PORT);
