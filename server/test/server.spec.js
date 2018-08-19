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
    it('should listen on the passed port', async function() {
        const PORT = parseInt(process.argv[2]);
        const resp = await chai.request(`http://localhost:${ PORT }`)
                               .get('/');

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 404);
    });

    it('should be able to connect to the database', async function() {
        const resp = await chai.request(server)
                               .get('/votes');

        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
    });
});

describe('PUT endpoints', function() {
    before(async function() {
        this.user = encodeURIComponent('Bany');
        this.vote = {
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6em'
        };
    });

    it('should replace or create a vote', async function() {
        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode')
                    .that.is.oneOf([201, 204]);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should replace a vote for an existing user', async function() {
        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 204);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should create a vote for a non existing user', async function() {
        const user = this.user + Math.random().toString();

        const resp = await chai.request(server)
                               .put(`/votes/${ user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 201);
        expect(resp).to.have.property('body')
                    .that.is.empty;
    });

    it('should nullify missing keys', async function() {
        const vote = Object.assign({}, this.vote);
        delete vote.large;

        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
                               .send(vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 204);
        expect(resp).to.have.property('body')
                    .that.is.empty;

        const fetchedVote = await chai.request(server)
                                      .get(`/votes/${ this.user }`);

        expect(fetchedVote).to.be.an('Object')
                           .with.property('body');
        expect(fetchedVote.body).to.be.an('Object')
                                .with.property('large', null);
    });

    it('should reject invalid input', async function() {
        this.vote.medium = '10';

        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
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

describe('PATCH endpoints', function() {
    before(function() {
        this.user = encodeURIComponent('Bany');
        this.vote = {
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6em'
        };
    });

    it('should only change defined keys', async function() {
        const insertResp = await chai.request(server)
                                     .put(`/votes/${ this.user }`)
                                     .send(this.vote);

        expect(insertResp).to.be.an('Object')
                          .with.property('ok', true);
        expect(insertResp).to.have.property('body')
                          .that.is.empty;

        const vote = Object.assign({}, this.vote);
        vote.tiny = '0.2em';
        vote.large = '0.7em';
        delete vote.small;
        delete vote.medium;
        delete vote.huge;

        const resp = await chai.request(server)
                               .patch(`/votes/${ this.user }`)
                               .send(vote);

        const resultVote = Object.assign({}, this.vote);
        Object.assign(resultVote, vote);

        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
        expect(resp).to.have.property('body')
                    .that.is.an('Object').that.eqls(resultVote);
    });

    it('should reply with a 404 for non-existing users', async function() {
        this.user += Math.random().toString();
        const resp = await chai.request(server)
                               .patch(`/votes/${ this.user }`)
                               .send(this.vote);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 404);
        expect(resp.body).to.be.an('Object')
                         .with.property('user', this.user);

    });
});

describe('GET endpoints', function() {
    before(function() {
        this.user = encodeURIComponent('Bany');
        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    });

    it('should fetch the vote of a single user', async function() {
        const resp = await chai.request(server)
                               .get(`/votes/${ this.user }`);

        expect(resp).to.be.an('Object')
                    .with.property('body');
        expect(resp.body).to.be.an('Object')
                         .that.has.all.keys(this.sizes.concat(['name']));
    });

    it('should reply with a 404 for non-existing users', async function() {
        this.user += Math.random().toString();
        const resp = await chai.request(server)
                               .get(`/votes/${ this.user }`);

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 404);
        expect(resp.body).to.be.an('Object')
                         .with.property('user', this.user);
    });

    it('should return all the votes grouped by value', async function() {
        const resp = await chai.request(server)
                               .get('/votes');

        expect(resp).to.be.an('Object')
                    .with.property('body');
        util.testVotesGroups.call(this, resp.body);
    });
});
