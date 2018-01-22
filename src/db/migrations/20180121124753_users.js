exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('users', function (table) {
    table.string('username', 100)
    .primary()
    .index('username_index');
    table.string('full_name', 200);
    table.string('password_hash', 128);
    table.string('email', 255).unique('user_email_unique_constraint');
    table.integer('balance');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
