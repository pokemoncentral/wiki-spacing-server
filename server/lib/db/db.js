/**
 * @fileoverview This file contains general database utility classes.
 *
 * Created by Davide on 9/15/18.
 */

const path = require('path');

const knex = require('knex');

/**
 * @summary General database utility functions and variables.
 *
 * @type {Object}
 */
const DB = {

    /**
     * This method remaps database error objects and knex Errors. It throws a
     * custom exception, based on the error code of the error as returned by
     * the database. Knex Errors are just wrapped in the custom exception.
     *
     * @summary Remaps database and knex errors to custom exceptions.
     *
     * @param {Object|Error} dbError - The database error object or a knex
     *      Error.
     *
     * @throws {MissingColumnError} For error code: 23502 - not_null_violation.
     * @throws {DBError} For any other error code and knex Errors.
     */
    makeError: dbError => {
        switch (parseInt(dbError.code)) {
            case 23502:
                throw new MissingColumnError(dbError);

            default:
                throw new DBError(dbError);
        }
    },

    /**
     * This method returns a function that sets the 'created' key on its
     * argument to the passed value. If the argument is not an object, one
     * with the argument as key 'result' is used to set 'created' on.
     *
     * This function is meant to be passed to the .ten() method to
     * post-process query results. This is not achieved by using .bind() to
     * partially apply the size name in order to avoid binding this int the
     * .then() callback.
     *
     * @summary Returns a function that sets the created key of its argument
     * to the passed value.
     *
     * @param {boolean} created - The value to set the create property to.
     * @return {function(*): {created: boolean}} A function setting the
     *      created property on its argument.
     */
    setCreated: created => {
        return function(result) {
            const target = type(result) === 'Object' ? result : {result};
            target.created = created;
            return target;
        };
    }
};

/**
 * With this configuration, knex connects to the database server at host 'db',
 * to the 'spacing' database as user 'wiki', with no password. The database
 * needs to be a PostgreSQL instance, version 10.5. The migration directory is
 * set to knex/migration in the server root.
 *
 * @summary Knex database configuration object.
 *
 * @type {Object}
 */
const knexConfig = {
    client: 'pg',
    version: '10.5',
    connection: {
        database: 'spacing',
        host: 'db',
        user: 'wiki'
    },
    migrations: {
        directory: path.join(__dirname, '..', '..', 'knex', 'migrations')
    }
};

/**
 * This function returns the knex configuration object connecting on the
 * given port.
 *
 * @summary Returns the knex configuration object.
 *
 * @param {int} port - The port the database is listening on.
 * @return {Object}
 */
const makeConfig = port => {
    knexConfig.connection.port = port;
    return knexConfig;
};

/**
 * This is the singleton database instance. In addition to its own methods, it
 * works as a proxy for the properties of the knex database connection.
 *
 * @summary Proxied singleton database instance.
 *
 * @type {Object}
 */
const dbInstance = new Proxy(DB, {
    has: (target, prop) =>
        Reflect.has(target, prop) || Reflect.has(target.connection, prop),

    get: (target, prop) => {
        if (Reflect.has(target.connection, prop)) {
            return Reflect.get(target.connection, prop);
        }

        if (Reflect.has(target, prop)) {
            return Reflect.get(target, prop);
        }
    }
});

/**
 * @summary Singleton DB factory. Creates the knex connection object if not
 * already present on the instance.
 *
 * @param {int} port - The port the database server is listening onto.
 * @return {Object}
 */
const getInstance = port => {
    if (!Reflect.has(DB, 'connection')) {
        dbInstance.connection = knex(makeConfig(port));
    }

    return dbInstance;
};

/**
 * @summary This class represents a generic database error.
 *
 * @extends Error
 */
class DBError extends Error {

    /**
     * The error can be a plain Object, that is expected to be a database
     * error, or an Error instance. In the former case, error.error is used as
     * default value for the message; otherwise, error.message is used.
     *
     * @summary Creates a DBError.
     *
     * @param {Object|Error} error - The database error object.
     * @param {string} [msg] - The error message. Defaults to error.message or
     *      error.error, depending which one is available.
     */
    constructor(error, msg) {
        msg = msg || (error instanceof Error ? error.message : error.error);
        super(msg);

        /**
         * @summary The database error object.
         *
         * @member {Object}
         */
        this.error = error;
    }
}

/**
 * @summary This class models the lack of a required column in a row.
 */
class MissingColumnError extends DBError {}

module.exports = {
    DB: {
        getInstance,
        makeConfig
    },
    DBError,
    MissingColumnError
};
