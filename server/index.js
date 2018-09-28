/**
 * @fileoverview This is the entry point of the server.
 *
 * Created by Davide on 8/12/18.
 */

const fs = require('fs');
const https = require('https');
const util = require('util');

const Koa = require('koa');

const readFile = util.promisify(fs.readFile);

const { DB } = require('./lib/db/db');
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

/**
 * This function creates the HTTPS web server with the given options, setting
 * it to listen on the port passed as first CLI argument.
 *
 * @param {object} opts - The options for the HTTPS web server.
 * @return {Server} The HTTPS server listening on the first CLI argument port.
 */
const createServer = opts => {
    const server = https.createServer(opts, app.callback());
    return server.listen(PORT);
};

/**
 * This function asynchronously reads TSL private key and certificates, and
 * returns an object containing them. This object is suited to be passed as
 * options to https.createServer().
 *
 * @summary Asynchronously reads certificate and key and returns the https
 * options object.
 *
 * @return {{key: string, cert: string}} The https option object.
 */
const getTsl = async () => {
    const baseDir = `${ __dirname }/tsl`;
    const key = await readFile(`${ baseDir }/privkey.pem`,{encoding: 'utf8'});
    const cert = await readFile(`${ baseDir }/cert.pem`, {encoding: 'utf8'});

    return {key, cert};
};

app.use(middleware);

module.exports = DB.getInstance(DB_PORT).migrate.latest()
    .then(getTsl)
    .then(createServer);
