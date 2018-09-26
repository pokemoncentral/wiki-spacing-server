// Update with your config settings.

const { DB } = require('../lib/db/db');

const DB_PORT = parseInt(process.env.DB_PORT);
const config = DB.makeConfig(DB_PORT);
delete config.migrations;

module.exports = config;
