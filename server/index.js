/**
 * @fileoverview This is the entry point of the server.
 *
 * Created by Davide on 8/12/18.
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const Koa = require('koa');
const util = require('util');

const readFile = util.promisify(fs.readFile);

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

getTsl()
    .then(opts => {
        const server = https.createServer(opts, app.callback());
        module.exports = server.listen(PORT);
    })
    .catch(console.log);
