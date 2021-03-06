/**
 * @fileoverview This file contains the routes for the /votes/grid endpoints.
 *
 * Created by Davide on 9/26/18.
 */

const { GridVote } = require('../../../../lib/db/vote');
const { makeRoutes } = require('../shared');

module.exports = makeRoutes(GridVote);
