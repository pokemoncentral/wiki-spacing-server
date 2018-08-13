/**
 * @fileoverview Tests file.
 *
 * Created by Davide on 8/12/18.
 */
 
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

/**
 * @summary Range of valid ports, shifted down by 1024.
 * @type {number}
 */
const PORT_RANGE = 2 ^ 16 - 1024;

/**
 * @summary Returns a random valid port number, between 1024 and 65536.
 * @return {number} A valid port number, between 1024 and 65536.
 */
const randomPort = () => Math.floor(Math.random() * PORT_RANGE + 1024);

// Changing argv to use random ports
const PORT = randomPort();
process.argv[2] = PORT.toString();
process.argv[3] = process.env.DB_PORT;

const server = require('../index.js');

describe('TDD testing', function() {
    describe('CLI parameters', function() {
        it('should listen on the passed port', async function() {
            const resp = await chai.request(`http://localhost:${ PORT }`)
                                   .get('/');

            expect(resp.ok).to.be.true;
        });

        it('should be able to connect to the database', async function() {
            const resp = await chai.request(server).get('/');
            const body = resp.body;

            expect(resp.ok).to.be.true;
            expect(body).not.to.have.any.keys('error');
        })
    });

    describe.skip('GET endpoints', function() {
        before(function() {
            this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
        });

        it('should retrieve the whole list of votes, grouped by vote',
                async function() {
            const resp = await chai.request(server).get('/votes/groups');
            const body = resp.body;

            expect(resp.ok).to.be.true;
            expect(body).to.have.all.keys(this.sizes);
            this.sizes.forEach(size => {
                expect(size).to.have.all.keys('value', 'voters');
                expect(size.value).to.be.a('string');
                expect(size.voters).to.be.an('array');
                size.voters.forEach(voter => expect(voter).to.be.a('string'));

                // Sizes should start with a number
                expect(size.value.match(/^\d+\.?\d*/)).not.to.be.null;
            });
        });
    });

    describe.skip('PUT endpoints', function() {
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

        it('should reject invalid input', async function() {
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

    describe.skip('POST endpoint', function() {
        it('should add a vote for a user', async function() {
            const user = 'Frænky';
            const vote = {
                name: user,
                tiny: '12ex',
                small: '0.2em',
                medium: '10em',
                large: '18px',
                huge: '0.6em'
            };

            const resp = await chai.request(server).post('/vote').send(vote);

            expect(resp.ok).to.be.true;
            const gotVote = chai.request(server).get(`/vote/${ user }`);
            const body = gotVote .body;

            expect(gotVote .ok).to.be.true;
            expect(body).to.eql(vote);
        });
    });
});
