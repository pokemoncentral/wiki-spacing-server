/**
 * @fileoverview Tests file.
 *
 * Created by Davide on 8/12/18.
 */
 
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-http'));

const { DB, DBError, MissingColumnError } = require('../lib/db.js');
const isValid = require('../lib/validate.js');

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

    describe('Database tests', function() {
        before(function() {
            this.db = new DB(parseInt(process.argv[3]));

            this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];

            this.user0 = 'Frænky';
            this.user1 = 'Flavìo';

            this.vote = {
                name: this.user0,
                tiny: '12ex',
                small: '0.2em',
                medium: '10em',
                large: '18px',
                huge: '0.6em'
            };
        });

        it('should insert a vote', async function() {
            const result = await this.db.insertVote(this.vote);

            expect(result).to.be.an('Object');
            expect(result).to.include.all.keys('created');
            expect(result.created).to.be.true;

            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.eql(this.vote);
        });

        it('should fetch a vote', async function() {
            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.eql(this.vote);
        });

        it('should replace a vote', async function() {
            this.vote.huge = '27em';
            const result = await this.db.updateVote(this.vote);

            expect(result).to.be.an('Object');
            expect(result).to.include.all.keys('created');
            expect(result.created).to.be.false;

            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.eql(this.vote);
        });

        it('should create the vote of a non-existing user', async function() {
            this.vote.name = this.user1;

            const result = await this.db.replaceVote(this.vote);

            expect(result).to.be.an('Object');
            expect(result).to.include.all.keys('created');
            expect(result.created).to.be.true;
        });

        it('should update the vote of an existing user', async function() {
            this.vote.name = this.user1;
            this.vote.tiny = '0.001ex';

            const result = await this.db.replaceVote(this.vote);

            expect(result).to.be.an('Object');
            expect(result).to.include.all.keys('created');
            expect(result.created).to.be.false;
        });

        it('should return all the votes grouped by value', async function() {
            const result = await this.db.getAllVotes();

            expect(result).to.be.an('Array');
            result.forEach(row => {
                expect(row).to.be.an('Object');
                expect(row).to.have.all.keys('size', 'value', 'names');

                expect(row.size).to.be.a('string');
                expect(row.size).to.be.oneOf(this.sizes);

                expect(row.value).to.be.a('string');
                // validity check

                expect(row.names).to.be.an('Array');
                row.names.forEach(name => { expect(name).to.be.a('string'); });
            })
        });
    });

    describe('Input validation', function() {
        before(function() {
            this.db = new DB(parseInt(process.argv[3]));

            this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];

            this.vote = {
                name: 'Snorlo',
                tiny: '12ex',
                small: '0.2em',
                medium: '10em',
                large: '18px',
                huge: '0.6em'
            };
        });

        it.skip('should accept valid votes', async function() {
            expect(isValid(this.vote)).to.be.true;
            expect(await this.db.insertVote(this.vote)).not.to.throw();
        });

        it('should reject missing keys', async function() {
            for (var key in this.vote) {
                const value = this.vote[key];
                this.vote.name += randomPort();
                delete this.vote[key];

                try {
                    await this.db.insertVote(this.vote);
                    expect.fail(db.DBError, Object,
                                `Vote without column ${ key } should not be `
                                + 'inserted');
                }
                catch (error) {
                    // Filtering since expect.fail also throws an exception
                    if (error instanceof DBError) {
                        expect(error).to.be.instanceof(MissingColumnError);
                    }
                }
                finally {
                    this.vote[key] = value;
                }
            }
        });

        it.skip('should reject invalid sizes', function() {
            this.sizes.forEach(size => {
                const value = this.vote[size];
                this.vote[size] = 'invalid';
                expect(isValid(this.vote)).to.be.false;
                this.vote[size] = value;
            });
        });
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
});
