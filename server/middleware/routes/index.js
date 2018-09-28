/**
 * @fileoverview This file combines all the routes.
 *
 * Created by Davide on 9/28/18.
 */
 
const votes = require('./votes');

module.exports = votes.routes({allowedMethods: true});
