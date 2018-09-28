/**
 * @fileoverview This file contains all the /votes REST routes.
 *
 * Created by Davide on 8/18/18.
 */

const Router = require('koa-router');

const grid = require('./grid');
const table = require('./table');

const router = new Router({
    prefix: '/votes'
});

router.nest('/grid', grid)
      .nest('/table', table);

module.exports = router;
