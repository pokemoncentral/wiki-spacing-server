
exports.up = function(knex) {
  return knex.renameTable('votes', 'grid_votes')
             .return(knex.createTable('table_votes',
                     t => t.raw('like grid_votes')));
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.dropTable('table_votes'),
      knex.renameTable('grid_votes', 'votes')
  ]);
};
