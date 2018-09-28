/**
 * @fileoverview This file test core-logic functions.
 *
 * Created by Davide on 8/16/18.
 */

const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-as-promised'));

const { clearDb, testVotesGroups } = require('./util');

const { DB, DBError, MissingColumnError } = require('../lib/db/db');
const { GridVote, TableVote } = require('../lib/db/vote');
const { isValidVote, validateVote } = require('../lib/validate-vote');

/**
 * @summary Test suite for a votes table manager.
 *
 * @param {VoteTableManager} DbClass - The votes table manager.
 * @return {function} The mocha test suite.
 */
const dbTests = DbClass => {
    return function() {
        before(async function() {
            const db = DB.getInstance(parseInt(process.env.DB_PORT));
            await db.migrate.latest();

            DbClass.connect(parseInt(process.env.DB_PORT));
            this.db = DbClass;
        });

        beforeEach(function() {
            /*
                The vote is often modified in-place within tests, so a new one is
                needed each time
            */
            this.vote = {
                name: 'Frænky',
                tiny: '12ex',
                small: '0.2em',
                medium: '10em',
                large: '18rem',
                huge: '0.6ex'
            };
        });

        afterEach(function() {
            return clearDb(this.db);
        });

        describe('get(voter)', function() {
            beforeEach(function() {
                return expect(this.db.insert(this.vote)).to.be.fulfilled;
            });

            it('should fetch a vote', function() {
                return expect(this.db.get(this.vote.name))
                    .to.eventually.eql(this.vote);
            });

            it('should return undefined for non-existing users', async function() {
                /* ************************ Setup ************************ */

                await clearDb(this.db);

                /* ************************ Tests ************************ */

                const vote = await this.db.get(this.vote.name);

                expect(vote).to.be.undefined;
            });
        });

        describe('get()', function() {
            beforeEach(async function() {
                await expect(this.db.insert(this.vote)).to.be.fulfilled;

                const vote = Object.assign({}, this.vote);
                vote.name += Math.random().toString();
                vote.huge = '5ex';
                vote.small = '0.3ex';

                await expect(this.db.insert(vote)).to.be.fulfilled;
            });

            it('should return all the votes grouped by value', async function() {
                const result = await this.db.get();
                testVotesGroups.call(this, result);
            });

            it('should return an empty array when there are no votes',
                async function() {
                    /* ************************ Setup ************************ */

                    await clearDb(this.db);

                    /* ************************ Tests ************************ */

                    const vote = await this.db.get();

                    expect(vote).to.be.empty;
                });
        });

        describe('insert()', function() {
            it('should insert a vote', async function() {
                const result = await this.db.insert(this.vote);

                expect(result).to.be.an('Object')
                              .with.property('created', true);

                const vote = await this.db.get(this.vote.name);

                expect(vote).to.eql(this.vote);
            });
        });

        describe('replace()', function() {
            it('should create the vote of a non-existing user', function() {
                return expect(this.db.replace(this.vote))
                    .to.eventually.be.an('Object')
                    .with.property('created', true);
            });

            it('should update the vote of an existing user', async function() {
                /* ************************ Setup ************************ */

                await expect(this.db.insert(this.vote)).to.be.fulfilled;

                /* ************************ Tests ************************ */

                this.vote.tiny = '0.001ex';

                const result = await this.db.replace(this.vote);

                expect(result).to.be.an('Object')
                              .with.property('created', false);
            });
        });

        describe('update()', function() {
            beforeEach(function() {
                return expect(this.db.insert(this.vote)).to.be.fulfilled;
            });

            it('should change a vote', async function() {
                this.vote.huge = '27em';
                const result = await this.db.update(this.vote);

                expect(result).to.be.an('Object')
                              .with.property('created', false);

                const vote = await this.db.get(this.vote.name);

                expect(vote).to.eql(this.vote);
            });

            it('should not touch undefined sizes', async function() {
                this.vote.huge = '2em';
                const incompleteVote = Object.assign({}, this.vote);
                delete incompleteVote.tiny;

                const result = await this.db.update(incompleteVote);

                expect(result).to.be.an('Object')
                              .with.property('created', false);

                const fetchedVote = await this.db.get(this.vote.name);

                expect(fetchedVote).to.eql(this.vote);
            });
        });
    }
};

describe('Database tests', function() {
    describe('GridVote tests', dbTests(GridVote));
    describe('TableVote tests', dbTests(TableVote));
});

describe('Input validation', function() {
    before(async function() {
        const db = DB.getInstance(parseInt(process.env.DB_PORT));
        await db.migrate.latest();

        GridVote.connect(parseInt(process.env.DB_PORT));
        this.db = GridVote;
    });

    beforeEach(function() {
        /*
            The vote is often modified in-place within tests, so a new one is
            needed each time
        */
        this.vote = {
            name: 'Snorlo',
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6ex'
        };
    });

    afterEach(function() {
        return clearDb(this.db);
    });

    it('invalid sizes should be rejected', function() {
        const invalidSizes = [
            ['1.em', 'Invalid CSS number'],
            ['9.2ef', 'Invalid unit of measure'],
            ['.2', 'No unit of measure'],
            ['', 'Empty size'],
            ['.9ex .3em .1rem', 'More than two sizes'],
            ['2.5em, 1.8ex', 'Non space-separated sizes']
        ];

        invalidSizes.forEach(([size, reason]) => {
            const errorMsg = `${ size }: ${ reason }`;
            const vote = Object.assign({}, this.vote);
            vote.medium = size;

            expect(isValidVote(vote), errorMsg).to.be.false;
            expect(validateVote(vote), errorMsg).to.be.an('Array')
                                                .that.eqls(['medium']);
        });
    });

    it('valid votes should be accepted', function() {
        expect(isValidVote(this.vote)).to.be.true;
        expect(validateVote(this.vote)).to.be.an('Array')
                                       .that.is.empty;
    });

    describe('insert()', function() {
        it('should not insert votes with no name', function() {
            delete this.vote.name;

            return expect(this.db.insert(this.vote))
                .to.be.rejectedWith(MissingColumnError);
        });

        it('should accept valid votes', function() {
            return expect(this.db.insert(this.vote)).to.be.fulfilled;
        });
    });

    describe('update()', function() {
        beforeEach(function() {
            return expect(this.db.insert(this.vote)).to.be.fulfilled;
        });

        it('should not update votes with no name', function() {
            delete this.vote.name;

            return expect(this.db.update(this.vote))
                .to.be.rejectedWith(DBError);
        });

        it('should accept valid votes', function() {
            return expect(this.db.update(this.vote)).to.be.fulfilled;
        });
    });

    describe('replace()', function() {
        describe('non-existing vote', function() {
            it('should not replace votes with no name', function() {
                delete this.vote.name;

                return expect(this.db.replace(this.vote))
                    .to.be.rejectedWith(DBError);
            });

            it('should accept valid votes', function() {
                return expect(this.db.replace(this.vote)).to.be.fulfilled;
            });
        });

        describe('existing vote', function() {
            beforeEach(function() {
                return expect(this.db.insert(this.vote)).to.be.fulfilled;
            });

            it('should not replace votes with no name', function() {
                delete this.vote.name;

                return expect(this.db.replace(this.vote))
                    .to.be.rejectedWith(DBError);
            });

            it('should accept valid votes', function() {
                return expect(this.db.replace(this.vote)).to.be.fulfilled;
            });
        });
    });
});
