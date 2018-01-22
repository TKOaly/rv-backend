var bcrypt = require('bcrypt');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          username: 'testuser',
          full_name: 'Tester',
          password_hash: bcrypt.hashSync('hunter2', 11),
          email: 'test@example.test',
          balance: 0
        }
      ]);
    });
};
