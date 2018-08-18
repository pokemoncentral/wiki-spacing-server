/**
 * @fileoverview This file test the server functionality.
 *
 * Created by Davide on 8/12/18.
 */
 
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-http'));

const util = require('./util');

// Changing argv to use a random port for the web server
util.setArgv();

const server = require('../index');

describe('CLI parameters', function() {
    const PORT = parseInt(process.argv[2]);
    it('should listen on the passed port', async function() {
        const resp = await chai.request(`http://localhost:${ PORT }`)
                               .get('/');

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 404);
    });

    it('should be able to connect to the database', async function() {
        const resp = await chai.request(server).get('/votes/groups');

        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
    });
});

describe('GET endpoints', function() {
    before(function() {
        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    });

    it('should retrieve the whole list of votes, grouped by vote',
            async function() {
        const resp = await chai.request(server).get('/votes/groups');

        expect(resp).to.be.an('Object')
                    .with.property('body');
        util.testVotesGroups.call(this, resp.body);
    });
});

describe('PUT endpoints', function() {
    before(async function() {
        this.user = 'Frænky';
        this.vote = {
            name: this.user,
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18px',
            huge: '0.6em'
        };
    });

    it.skip('should reject invalid input', async function() {
        const user = 'Flavìo';
        this.vote.name = user;
        this.vote.medium = '10';
        delete this.vote.huge;

        const resp = await chai.request(server).put(`/vote/${ user }`)
                               .send(this.vote);
        const body = resp.body;

        expect(resp.ok).to.be.false;
        expect(body).to.have.all.keys('error');
        expect(body.error).to.have.all.keys('code', 'message');
        expect(body.error.code).to.equal(12);
        expect(body.error.message).to.equal('Invalid input');
    });

    it('should replace or create a vote', async function() {
        const resp = await chai.request(server).put(`/vote/${ this.user }`)
                               .send(this.vote);

        expect(resp.status).to.be.oneOf([201, 204]);
    });

    it('should replace a vote for an existing user', async function() {
        this.vote.small = '25em';

        const resp = await chai.request(server).put(`/vote/${ this.user }`)
                               .send(this.vote);

        expect(resp.status).to.equal(201);
    });

    it('should create a vote for a non existing user', async function() {
        const user = this.user + randomPort().toString();
        this.vote.name = user;

        const resp = await chai.request(server).put(`/vote/${ user }`)
                               .send(this.vote);

        expect(resp.status).to.equal(204);
    });
});
