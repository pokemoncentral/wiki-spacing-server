/**
 * @fileoverview This file test the server functionality.
 *
 * Created by Davide on 8/12/18.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-http'));

const { clearDb, setArgv, testVotesGroups } = require('./util');

// Changing argv to use a random port for the web server
setArgv();

const { GridVote, TableVote } = require('../lib/db/vote');
const server = require('../index');

const voteEndpoint = (subPrefix, DbClass) => {
    const prefix = `/votes/${ subPrefix }`;
    return function() {
        before(function() {
            this.db = DbClass;
            this.prefix = prefix;
        });

        describe('GET endpoints', function() {
            before(async function() {
                this.server = chai.request(await server)
                                  .keepOpen();
                this.user = encodeURIComponent('Bany');
                this.vote = {
                    tiny: '12ex',
                    small: '0.2em',
                    medium: '10em',
                    large: '18rem',
                    huge: '0.6em'
                };
            });

            after(function() {
                this.server.close();
            });

            beforeEach(async function() {
                const resp = await this.server
                                       .put(`${ this.prefix }/${ this.user }`)
                                       .send(this.vote);
                expect(resp).to.be.an('Object')
                            .with.property('ok', true);
            });

            afterEach(function() {
                return clearDb(this.db);
            });

            describe(prefix, function() {
                beforeEach(async function() {
                    const user = this.user + Math.random().toString();
                    const vote = Object.assign({}, this.vote);
                    vote.huge = '5ex';
                    vote.small = '0.3ex';

                    const resp = await this.server
                                           .put(`${ this.prefix }/${ user }`)
                                           .send(vote);
                    expect(resp).to.be.an('Object')
                                .with.property('ok', true);
                });

                it('should return all the votes grouped by value', async function() {
                    const resp = await this.server
                                           .get(this.prefix);

                    expect(resp).to.be.an('Object')
                                .with.property('body');
                    testVotesGroups.call(this, resp.body);
                });

                it('should reply with 204 when there are no votes', async function() {
                    /* ************************ Setup ************************ */

                    await clearDb(this.db);

                    /* ************************ Tests ************************ */

                    const resp = await this.server
                                           .get(this.prefix);

                    expect(resp).to.have.status(204);
                    expect(resp).to.be.an('Object')
                                .with.property('body')
                        .that.is.empty;
                });
            });

            describe(`${ prefix }/:voter`, function() {
                it('should fetch the vote of a single user', async function() {
                    const resp = await this.server
                                           .get(`${ this.prefix }/${ this.user }`);
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

                    await clearDb(this.db);

                    /* ************************ Tests ************************ */

                    const resp = await this.server
                                           .get(`${ this.prefix }/${ this.user }`);

                    expect(resp).to.have.status(404);
                    expect(resp).to.be.an('Object')
                                .with.property('body')
                                .that.is.an('Object')
                                .with.property('user', this.user);
                });
            });
        });

        describe('PATCH endpoints', function() {
            before(async function() {
                this.server = chai.request(await server)
                                  .keepOpen();
                this.user = encodeURIComponent('Bany');
            });

            after(function() {
                this.server.close();
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

                const resp = await this.server
                                       .put(`${ this.prefix }/${ this.user }`)
                                       .send(this.vote);
                expect(resp).to.be.an('Object')
                            .with.property('ok', true);
            });

            afterEach(function() {
                return clearDb(this.db);
            });

            describe(`${ prefix }/:voter`, function() {
                it('should only change defined keys', async function() {
                    const patch = Object.assign({}, this.vote);
                    patch.tiny = '0.2em';
                    patch.large = '0.7em';
                    delete patch.small;
                    delete patch.medium;
                    delete patch.huge;

                    Object.assign(this.vote, patch);

                    const resp = await this.server
                                           .patch(`${ this.prefix }/${ this.user }`)
                                           .send(patch);

                    expect(resp).to.be.an('Object')
                                .with.property('ok', true);
                    expect(resp).to.have.property('body')
                                .that.is.an('Object').that.eqls(this.vote);
                });

                it('should reply with a 404 for non-existing users', async function() {
                    /* ************************ Setup ************************ */

                    await clearDb(this.db);

                    /* ************************ Tests ************************ */

                    const resp = await this.server
                                           .patch(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.have.status(404);
                    expect(resp).to.be.an('Object')
                                .with.property('body')
                                .that.is.an('Object')
                                .with.property('user', this.user);
                });
            });
        });

        describe('PUT endpoints', function() {
            before(async function() {
                this.server = chai.request(await server)
                                  .keepOpen();
                this.user = encodeURIComponent('Bany');
            });

            after(function() {
                this.server.close();
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
                return clearDb(this.db);
            });

            describe(`${ prefix }/:voter`, function() {
                it('should replace or create a vote', async function() {
                    const resp = await this.server
                                           .put(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.be.an('Object')
                                .with.property('statusCode')
                                .that.is.oneOf([201, 204]);
                    expect(resp).to.have.property('body')
                        .that.is.empty;
                });

                it('should replace a vote for an existing user', async function() {
                    /* ************************ Setup ************************ */

                    const insertResp = await this.server
                                                 .put(`${ this.prefix }/${ this.user }`)
                                                 .send(this.vote);

                    expect(insertResp).to.be.an('Object')
                                      .with.property('ok', true);

                    /* ************************ Tests ************************ */

                    const resp = await this.server
                                           .put(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.have.status(204);
                    expect(resp).to.be.an('Object')
                                .with.property('body')
                                .that.is.an('Object')
                        .that.is.empty;
                });

                it('should create a vote for a non existing user', async function() {
                    const resp = await this.server
                                           .put(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.have.status(201);
                    expect(resp).to.be.an('Object')
                                .with.property('body')
                                .that.is.an('Object')
                        .that.is.empty;
                });

                it('should nullify missing keys', async function() {
                    /* ************************ Setup ************************ */

                    const insertResp = await this.server
                                                 .put(`${ this.prefix }/${ this.user }`)
                                                 .send(this.vote);

                    expect(insertResp).to.be.an('Object')
                                      .with.property('ok', true);

                    /* ************************ Tests ************************ */

                    delete this.vote.large;
                    const resp = await this.server
                                           .put(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.be.an('Object')
                                .with.property('ok', true);

                    const fetchedVote = await this.server
                                                  .get(`${ this.prefix }/${ this.user }`);

                    expect(fetchedVote).to.be.an('Object')
                                       .with.property('ok', true);

                    expect(fetchedVote).to.be.an('Object')
                                       .with.property('body');
                    expect(fetchedVote.body).to.be.an('Object')
                                            .with.property('large', null);
                });

                it('should reject invalid input', async function() {
                    this.vote.medium = '10';

                    const resp = await this.server
                                           .put(`${ this.prefix }/${ this.user }`)
                                           .send(this.vote);

                    expect(resp).to.have.status(400);

                    expect(resp).to.have.property('body')
                                .that.is.an('Object');
                    expect(resp.body).to.have.property('error')
                                     .that.is.a('string');
                    expect(resp.body).to.have.property('invalidSizes')
                                     .that.is.an('Array')
                                     .that.eqls(['medium']);
                });
            });
        });
    };
};

describe('Web server tests', function() {
    before(async function() {
        this.server = chai.request(await server)
                          .keepOpen();
    });

    after(function() {
        this.server.close();
    });

    it('should listen on the passed port', async function() {
        const PORT = parseInt(process.argv[2]);
        const resp = await chai.request(`https://localhost:${ PORT }`)
                               .get('/');

        expect(resp).to.have.status(404);
    });

    it('should be able to connect to the database', async function() {
        const resp = await this.server
                               .get('/votes/grid');

        expect(resp).to.be.an('Object')
                    .with.property('ok', true);
    });

    it('should reply with a 400 for invalid JSON bodies', async function() {
        const resp = await this.server
                               .patch(`/votes/grid/randomUser`)
                               .set('Content-type', 'application/json')
                               .send('{"invalidJSON"');

        expect(resp).to.have.status(400);
        expect(resp).to.be.an('Object')
                    .with.property('body')
                    .that.is.an('object')
                    .with.property('error')
                    .that.includes('JSON');
    });
});

describe('/votes endpoint tests', function() {
    describe('/votes/grid tests', voteEndpoint('grid', GridVote));
    describe('/votes/table tests', voteEndpoint('table', TableVote));
});
