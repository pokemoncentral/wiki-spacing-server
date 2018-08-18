/**
 * @fileoverview This file test core-logic functions.
 *
 * Created by Davide on 8/16/18.
 */

const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-as-promised'));

const util = require('./util');

const { DB, MissingColumnError } = require('../lib/db');
const { isValid, validate } = require('../lib/validate');

describe('Database tests', function() {
    before(function() {
        this.db = new DB(parseInt(process.env.DB_PORT));

        this.sizes = ['tiny', 'small', 'medium', 'large', 'huge'];

        this.user0 = 'Frænky';
        this.user1 = 'Flavìo';

        this.vote = {
            name: this.user0,
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6ex'
        };
    });

    it('should insert a vote', async function() {
        const result = await this.db.insertVote(this.vote);

        expect(result).to.be.an('Object')
                      .with.property('created', true);

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

        expect(result).to.be.an('Object')
                      .with.property('created', false);

        const vote = await this.db.getVote(this.vote.name);

        expect(vote).to.eql(this.vote);
    });

    it('should only replace the supplied values of a vote', async function() {
        this.vote.huge = '2em';
        const incompleteVote = Object.assign({}, this.vote);
        delete incompleteVote.tiny;

        const result = await this.db.updateVote(incompleteVote);

        expect(result).to.be.an('Object')
                      .with.property('created', false);

        const fetchedVote = await this.db.getVote(this.vote.name);

        expect(fetchedVote).to.eql(this.vote);
    });

    it('should create the vote of a non-existing user', async function() {
        this.vote.name = this.user1;

        const result = await this.db.replaceVote(this.vote);

        expect(result).to.be.an('Object')
                      .with.property('created', true);
    });

    it('should update the vote of an existing user', async function() {
        this.vote.name = this.user1;
        this.vote.tiny = '0.001ex';

        const result = await this.db.replaceVote(this.vote);

        expect(result).to.be.an('Object')
                      .with.property('created', false);
    });

    it('should return all the votes grouped by value', async function() {
        const result = await this.db.getAllVotes();
        util.testVotesGroups.call(this, result);
    });
});

describe('Input validation', function() {
    before(function() {
        this.db = new DB(parseInt(process.argv[3]));

        this.vote = {
            name: 'Snorlo',
            tiny: '12ex',
            small: '0.2em',
            medium: '10em',
            large: '18rem',
            huge: '0.6ex'
        };
    });

    it('should accept valid votes', function() {
        expect(isValid(this.vote)).to.be.true;
        expect(validate(this.vote)).to.be.an('Array')
                                   .that.is.empty;
    });

    it('should reject a vote with no name', function() {
        const vote = Object.assign({}, this.vote);
        delete vote.name;

        return expect(this.db.insertVote(vote))
            .to.be.rejectedWith(MissingColumnError);
    });

    it('should reject invalid sizes', function() {
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

            expect(isValid(vote), errorMsg).to.be.false;
            expect(validate(vote), errorMsg).to.be.an('Array')
                                            .that.eqls(['medium']);
        });
    });
});
