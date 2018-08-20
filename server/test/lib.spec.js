/**
 * @fileoverview This file test core-logic functions.
 *
 * Created by Davide on 8/16/18.
 */

const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-as-promised'));

const { clearDb, testVotesGroups } = require('./util');

const { DB, DBError, MissingColumnError } = require('../lib/db');
const { isValidVote, validateVote } = require('../lib/validate-vote');

describe('Database tests', function() {
    before(function() {
        this.db = new DB(parseInt(process.env.DB_PORT));
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
        return clearDb();
    });

    describe('getVote()', function() {
        beforeEach(function() {
            return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
        });

        it('should fetch a vote', function() {
            return expect(this.db.getVote(this.vote.name))
                .to.eventually.eql(this.vote);
        });

        it('should return undefined for non-existing users', async function() {
            /* ************************ Setup ************************ */

            await clearDb();

            /* ************************ Tests ************************ */

            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.be.undefined;
        });
    });

    describe('getAllVotes()', function() {
        beforeEach(async function() {
            await expect(this.db.insertVote(this.vote)).to.be.fulfilled;

            const vote = Object.assign({}, this.vote);
            vote.name += Math.random().toString();
            vote.huge = '5ex';
            vote.small = '0.3ex';

            await expect(this.db.insertVote(vote)).to.be.fulfilled;
        });

        it('should return all the votes grouped by value', async function() {
            const result = await this.db.getAllVotes();
            testVotesGroups.call(this, result);
        });

        it('should return an empty array when there are no votes',
                async function() {
            /* ************************ Setup ************************ */

            await clearDb();

            /* ************************ Tests ************************ */

            const vote = await this.db.getAllVotes();

            expect(vote).to.be.empty;
        });
    });

    describe('insertVote()', function() {
        it('should insert a vote', async function() {
            const result = await this.db.insertVote(this.vote);

            expect(result).to.be.an('Object')
                          .with.property('created', true);

            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.eql(this.vote);
        });
    });

    describe('replaceVote()', function() {
        it('should create the vote of a non-existing user', function() {
            return expect(this.db.replaceVote(this.vote))
                .to.eventually.be.an('Object')
                .with.property('created', true);
        });

        it('should update the vote of an existing user', async function() {
            /* ************************ Setup ************************ */

            await expect(this.db.insertVote(this.vote)).to.be.fulfilled;

            /* ************************ Tests ************************ */

            this.vote.tiny = '0.001ex';

            const result = await this.db.replaceVote(this.vote);

            expect(result).to.be.an('Object')
                          .with.property('created', false);
        });
    });

    describe('updateVote()', function() {
        beforeEach(function() {
            return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
        });

        it('should change a vote', async function() {
            this.vote.huge = '27em';
            const result = await this.db.updateVote(this.vote);

            expect(result).to.be.an('Object')
                          .with.property('created', false);

            const vote = await this.db.getVote(this.vote.name);

            expect(vote).to.eql(this.vote);
        });

        it('should not touch undefined sizes', async function() {
            this.vote.huge = '2em';
            const incompleteVote = Object.assign({}, this.vote);
            delete incompleteVote.tiny;

            const result = await this.db.updateVote(incompleteVote);

            expect(result).to.be.an('Object')
                          .with.property('created', false);

            const fetchedVote = await this.db.getVote(this.vote.name);

            expect(fetchedVote).to.eql(this.vote);
        });
    });
});

describe('Input validation', function() {
    before(function() {
        this.db = new DB(parseInt(process.argv[3]));
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
        return clearDb();
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

    describe('insertVote()', function() {
        it('should not insert votes with no name', function() {
            delete this.vote.name;

            return expect(this.db.insertVote(this.vote))
                .to.be.rejectedWith(MissingColumnError);
        });

        it('should accept valid votes', function() {
            return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
        });
    });

    describe('updateVote()', function() {
        beforeEach(function() {
            return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
        });

        it('should not update votes with no name', function() {
            delete this.vote.name;

            return expect(this.db.updateVote(this.vote))
                .to.be.rejectedWith(DBError);
        });

        it('should accept valid votes', function() {
            return expect(this.db.updateVote(this.vote)).to.be.fulfilled;
        });
    });

    describe('replaceVote()', function() {
        describe('non-existing vote', function() {
            it('should not replace votes with no name', function() {
                delete this.vote.name;

                return expect(this.db.replaceVote(this.vote))
                    .to.be.rejectedWith(DBError);
            });

            it('should accept valid votes', function() {
                return expect(this.db.replaceVote(this.vote)).to.be.fulfilled;
            });
        });

        describe('existing vote', function() {
            beforeEach(function() {
                return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
            });

            it('should not replace votes with no name', function() {
                delete this.vote.name;

                return expect(this.db.replaceVote(this.vote))
                    .to.be.rejectedWith(DBError);
            });

            it('should accept valid votes', function() {
                return expect(this.db.replaceVote(this.vote)).to.be.fulfilled;
            });
        });
    });
});
