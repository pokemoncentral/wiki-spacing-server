/**
 * @fileoverview
 *
 * Created by Davide on 9/26/18.
 */

const { GridVote } = require('../../../../lib/db/vote');
const { makeRoutes } = require('../shared');

module.exports = makeRoutes(GridVote);
