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
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6em'
        };
    });

    it('should replace or create a vote', async function() {
        const resp = await chai.request(server).put(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode')
                    .that.is.oneOf([201, 204]);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should replace a vote for an existing user', async function() {
        const resp = await chai.request(server).put(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode')
                    .that.equals(204);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should create a vote for a non existing user', async function() {
        const user = this.user + Math.random().toString();

        const resp = await chai.request(server).put(`/votes/${ user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode')
                    .that.equals(201);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should reject invalid input', async function() {
        this.vote.medium = '10';

        const resp = await chai.request(server).put(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('ok', false);

        expect(resp.body).to.be.an('Object');
        expect(resp.body).to.have.property('error')
                         .that.is.a('string');
        expect(resp.body).to.have.property('invalidSizes')
                         .that.is.an('Array')
                         .that.eqls(['medium']);
    });
});
