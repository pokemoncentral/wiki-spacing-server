/**
 * @fileoverview This file contains code to validate votes. The presence of
 * all keys is deferred to database insertion, relying on schema constraints.
 *
 * Created by Davide on 8/15/18.
 */

/**
 * @summary Returns the size names of a vote.
 *
 * @param {Vote} vote - The vote whose size names will be returned.
 * @return {string[]} The size names of the passed vote.
 */
const getSizes = vote => Object.keys(vote)
    .filter(key => key !== 'name');

/**
 * This function returns true if the passed size value is valid. This means
 * that:
 * <ul>
 *     <li>It must begin with a valid CSS number (eg, 9 - 0.2 - .5).</li>
 *     <li>It must end with one of these units of measure: ex, em or rem.</li>
 *     <li>All of the above is repeated one or twice.</li>
 * </ul>
 *
 * @summary Returns true if the size value is valid.
 *
 * @param {string} size - The size value to be validated.
 * @return {boolean} Whether the size value is valid.
 */
const validSize = size => /^(\d*\.?\d+\s*(em|ex|rem)\s*){1,2}$/.test(size);

/**
 * @summary Returns the invalid size names of a vote.
 *
 * @param {Vote} vote - The vote that will be validated.
 * @return {string[]} The size names whose size value is invalid.
 */
const validate = (vote) =>
    getSizes(vote)
        .filter(size => !validSize(vote[size]));

/**
 * @summary Returns true if all the sizes in a vote are valid.
 *
 * @param {Vote} vote - The vote that will be validated.
 * @returns {boolean} Whether all the sizes in vote are valid.
 */
const isValid = (vote) =>
    getSizes(vote)
        .map(size => vote[size])
        .every(validSize);

module.exports = {
    isValid,
    validate,
};
