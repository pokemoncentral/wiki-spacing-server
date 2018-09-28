/**
 * @fileoverview
 *
 * Created by Davide on 9/26/18.
 */

const { TableVote } = require('../../../../lib/db/vote');
const { makeRoutes } = require('../shared');

module.exports = makeRoutes(TableVote);
