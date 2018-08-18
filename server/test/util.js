/**
 * @fileoverview This file contains utility functions for tests.
 *
 * Created by Davide on 8/18/18.
 */

const chai = require('chai');
const expect = chai.expect;

/**
 * @summary Range of valid ports, shifted down by 1024.
 * @type {number}
 */
const PORT_RANGE = 2 ^ 16 - 1024;

/**
 * @summary Returns a random valid port number, between 1024 and 65536.
 * @return {int} A valid port number, between 1024 and 65536.
 */
const randomPort = () => Math.floor(Math.random() * PORT_RANGE + 1024);

const setArgv = () => {
    process.argv[2] = randomPort().toString();
    process.argv[3] = process.env.DB_PORT;
};

// need to bind this
const testVotesGroups = function(groups) {
    expect(groups).to.be.an('Array');
    groups.forEach(row => {
        expect(row).to.be.an('Object')
                   .with.all.keys('size', 'value', 'voters');

        expect(row.size).to.be.a('string')
                        .that.is.oneOf(this.sizes);

        expect(row.value).to.be.a('string');

        expect(row.voters).to.be.an('Array');
        row.voters.forEach(name => { expect(name).to.be.a('string'); });
    });
};

module.exports = {
    randomPort,
    setArgv,
    testVotesGroups
};
