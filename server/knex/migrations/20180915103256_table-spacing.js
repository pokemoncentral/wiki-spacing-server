
exports.up = function(knex) {
  return knex.schema.renameTable('votes', 'grid_votes')
                    .return(knex.schema.raw('create table table_votes'
                        + '(like grid_votes)'));
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('table_votes'),
      knex.schema.renameTable('grid_votes', 'votes')
  ]);
};
