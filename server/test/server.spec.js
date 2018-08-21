/**
 * @fileoverview This file test the server functionality.
 *
 * Created by Davide on 8/12/18.
 */
 
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-http'));

const { clearDb, setArgv, testVotesGroups } = require('./util');

// Changing argv to use a random port for the web server
setArgv();

const server = require('../index');

describe('The web server', function() {
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

    it('should reply with a 400 for invalid JSON bodies', async function() {
        const resp = await chai.request(server)
                               .patch(`/votes/randomUser`)
                               .set('Content-type', 'application/json')
                               .send('{"invalidJSON"');

        expect(resp).to.be.an('Object')
                    .with.property('statusCode', 400);
        expect(resp).to.have.property('body')
                    .that.is.an('object')
                    .with.property('error')
                    .that.includes('JSON');
    });
});

describe('GET endpoints', function() {
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

    beforeEach(async function() {
        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
                               .send(this.vote);
        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
    });

    afterEach(function() {
        return clearDb();
    });

    describe('/votes', function() {
        beforeEach(async function() {
            const user = this.user + Math.random().toString();
            const vote = Object.assign({}, this.vote);
            vote.huge = '5ex';
            vote.small = '0.3ex';

            const resp = await chai.request(server)
                                   .put(`/votes/${ user }`)
                                   .send(vote);
            expect(resp).to.be.an('Object')
                        .with.property('ok', true);
        });

        it('should return all the votes grouped by value', async function() {
            const resp = await chai.request(server)
                                   .get('/votes');

            expect(resp).to.be.an('Object')
                        .with.property('body');
            testVotesGroups.call(this, resp.body);
        });

        it('should reply with 204 when there are no votes', async function() {
            /* ************************ Setup ************************ */

            await clearDb();

            /* ************************ Tests ************************ */

            const resp = await chai.request(server)
                                   .get('/votes');

            expect(resp).to.be.an('Object')
                        .with.property('statusCode', 204);
            expect(resp).to.have.property('body')
                        .that.is.empty;
        });
    });

    describe('/votes/:voter', function() {
        it('should fetch the vote of a single user', async function() {
            const resp = await chai.request(server)
                                   .get(`/votes/${ this.user }`);
            expect(resp).to.be.an('Object')
                        .with.property('body')
                        .that.is.an('Object');

            const vote = resp.body;

            expect(vote).to.have.property('name', this.user);

            delete vote.name;

            expect(vote).to.eql(this.vote);
        });

        it('should reply with a 404 for non-existing users', async function() {
            /* ************************ Setup ************************ */

            await clearDb();

            /* ************************ Tests ************************ */

            const resp = await chai.request(server)
                                   .get(`/votes/${ this.user }`);

            expect(resp).to.be.an('Object')
                        .with.property('statusCode', 404);
            expect(resp.body).to.be.an('Object')
                             .with.property('user', this.user);
        });
    });
});

describe('PATCH endpoints', function() {
    before(function() {
        this.user = encodeURIComponent('Bany');
    });

    beforeEach(async function() {
        /*
            The vote is often modified in-place within tests, so a new one is
            needed each time
        */
        this.vote = {
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6em'
        };

        const resp = await chai.request(server)
                               .put(`/votes/${ this.user }`)
                               .send(this.vote);
        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
    });

    afterEach(function() {
        return clearDb();
    });

    describe('/votes/:voter', function() {
        it('should only change defined keys', async function() {
            const patch = Object.assign({}, this.vote);
            patch.tiny = '0.2em';
            patch.large = '0.7em';
            delete patch.small;
            delete patch.medium;
            delete patch.huge;

            Object.assign(this.vote, patch);

            const resp = await chai.request(server)
                                   .patch(`/votes/${ this.user }`)
                                   .send(patch);

            expect(resp).to.be.an('Object')
                        .with.property('ok', true);
            expect(resp).to.have.property('body')
                        .that.is.an('Object').that.eqls(this.vote);
        });

        it('should reply with a 404 for non-existing users', async function() {
            /* ************************ Setup ************************ */

            await clearDb();

            /* ************************ Tests ************************ */

            const resp = await chai.request(server)
                                   .patch(`/votes/${ this.user }`)
                                   .send(this.vote);

            expect(resp).to.be.an('Object')
                        .with.property('statusCode', 404);
            expect(resp.body).to.be.an('Object')
                             .with.property('user', this.user);
        });
    });
});

describe('PUT endpoints', function() {
    before(function() {
        this.user = encodeURIComponent('Bany');
    });

    beforeEach(async function() {
        /*
            The vote is often modified in-place within tests, so a new one is
            needed each time
        */
        this.vote = {
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6em'
        };
    });

    afterEach(function() {
        return clearDb();
    });

    describe('/votes/:voter', function() {
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
            /* ************************ Setup ************************ */

            const insertResp = await chai.request(server)
                                         .put(`/votes/${ this.user }`)
                                         .send(this.vote);

            expect(insertResp).to.be.an('Object')
                              .with.property('ok', true);

            /* ************************ Tests ************************ */

            const resp = await chai.request(server)
                                   .put(`/votes/${ this.user }`)
                                   .send(this.vote);

            expect(resp).to.be.an('Object')
                        .with.property('statusCode', 204);
            expect(resp).to.have.property('body')
                        .that.is.empty;
        });

        it('should create a vote for a non existing user', async function() {
            const resp = await chai.request(server)
                                   .put(`/votes/${ this.user }`)
                                   .send(this.vote);

            expect(resp).to.be.an('Object')
                        .with.property('statusCode', 201);
            expect(resp).to.have.property('body')
                        .that.is.empty;
        });

        it('should nullify missing keys', async function() {
            /* ************************ Setup ************************ */

            const insertResp = await chai.request(server)
                                         .put(`/votes/${ this.user }`)
                                         .send(this.vote);

            expect(insertResp).to.be.an('Object')
                              .with.property('ok', true);

            /* ************************ Tests ************************ */

            delete this.vote.large;
            const resp = await chai.request(server)
                                   .put(`/votes/${ this.user }`)
                                   .send(this.vote);

            expect(resp).to.be.an('Object')
                        .with.property('ok', true);

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
                        .with.property('statusCode', 400);

            expect(resp.body).to.be.an('Object');
            expect(resp.body).to.have.property('error')
                             .that.is.a('string');
            expect(resp.body).to.have.property('invalidSizes')
                             .that.is.an('Array')
                             .that.eqls(['medium']);
        });
    });
});
