// Update with your config settings.

const { DB } = require('../lib/db');

const DB_PORT = parseInt(process.env.DB_PORT);
module.exports = DB.makeConfig(DB_PORT);
