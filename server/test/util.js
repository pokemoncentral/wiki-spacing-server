/**
 * @fileoverview This file contains utility functions for tests.
 *
 * Created by Davide on 8/18/18.
 */

const chai = require('chai');
const expect = chai.expect;

/**
 * @summary Range of valid ports, shifted down by 1024.
 * @type {int}
 */
const PORT_RANGE = 2 ^ 16 - 1024;

/**
 * @summary Returns a random valid port number, between 1024 and 65536.
 * @return {int} A valid port number, between 1024 and 65536.
 */
const randomPort = () => Math.floor(Math.random() * PORT_RANGE + 1024);

/**
 * This function sets the CLI arguments, normally find in process.argv. The
 * second one is set to a random port, meant to be used as web server port.
 * The third one is used as the database port, and is set to the environment
 * variable $DB_PORT.
 *
 * @summary Sets process.argv items.
 */
const setArgv = () => {
    process.argv[2] = randomPort().toString();
    process.argv[3] = process.env.DB_PORT;
};

/**
 * This function is meant to test the correctness of the structure returned by
 * the query for all votes grouped by value.
 *
 * @summary Tests on the result of the query grouping all votes.
 *
 * @param {Object[]} groups - The result of the query.
 */
/*
    Not using arrow function since in mocha we normally set `this` to the test
    suite context.
*/
const testVotesGroups = function(groups) {
    const sizes = ['tiny', 'small', 'medium', 'large', 'huge'];

    expect(groups).to.be.an('Array');
    groups.forEach(row => {
        expect(row).to.be.an('Object')
                   .with.all.keys('size', 'value', 'voters');

        expect(row.size).to.be.a('string')
                        .that.is.oneOf(sizes);

        expect(row.value).to.be.a('string');

        expect(row.voters).to.be.an('Array');
        row.voters.forEach(name => { expect(name).to.be.a('string'); });
    });
};

module.exports = {
    setArgv,
    testVotesGroups
};
