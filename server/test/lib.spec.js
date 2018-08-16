/**
 * @fileoverview This file test core-logic functions.
 *
 * Created by Davide on 8/16/18.
 */

const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');

chai.use(require('chai-as-promised'));

const { DB, MissingColumnError } = require('../lib/db.js');
const { isValid, validate } = require('../lib/validate.js');

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

        expect(result).to.be.an('Array');
        result.forEach(row => {
            expect(row).to.be.an('Object')
                       .with.all.keys('size', 'value', 'names');

            expect(row.size).to.be.a('string')
                            .that.is.oneOf(this.sizes);

            expect(row.value).to.be.a('string');

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
            large: '18rem',
            huge: '0.6ex'
        };
    });

    it('should accept valid votes', function() {
        expect(isValid(this.vote)).to.be.true;
        expect(validate(this.vote)).to.be.an('Array').that.is.empty;
        return expect(this.db.insertVote(this.vote)).to.be.fulfilled;
    });

    it('should reject missing keys', function() {
        return Promise.all(
            Object.keys(this.vote).map(key => {
                const vote = Object.assign({}, this.vote);
                vote.name += Math.random();
                delete vote[key];

                return expect(this.db.insertVote(vote))
                    .to.be.rejectedWith(MissingColumnError);
            })
        );
    });

    it('should reject invalid sizes', function() {
        this.sizes.forEach(size => {
            const vote = Object.assign({}, this.vote);
            vote[size] = 'invalid';

            expect(isValid(vote)).to.be.false;
            expect(validate(vote)).to.be.an('Array')
                                  .that.eql([size]);
        });
    });
});
