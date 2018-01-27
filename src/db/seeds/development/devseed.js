var bcrypt = require('bcrypt');

exports.seed = function(knex, Promise) {
  return knex('roles').del()
    .then(() => {
      return knex('roles').insert([
        {
          role_name: 'user',
          role_description: 'Regular user'
        },
        {
          role_name: 'superuser',
          role_description: 'Super user'
        },
        {
          role_name: 'admin',
          role_description: 'Administrator'
        }
      ]);
    })
    .then(() => {
      return knex('users').del()
    })
    .then(() => {
      return knex('users').insert([
        {
          username: 'normal_user',
          full_name: 'John Doe',
          password_hash: bcrypt.hashSync('hunter2', 11),
          email: 'address@example.com',
          account_balance: 500
        },
        {
          username: 'super_user',
          full_name: 'Super User',
          password_hash: bcrypt.hashSync('superduper5000', 11),
          email: 'super@example.com',
          account_balance: 500
        },
        {
          username: 'admin_user',
          full_name: 'BOFH',
          password_hash: bcrypt.hashSync('admin123', 11),
          email: 'admin@example.com',
          account_balance: 500
        }
      ]);
    })
    .then(() => {
      return knex('user_roles').del()
    })
    .then(() => {
      return knex('user_roles').insert([
        {
          user: 'normal_user',
          role: 'user'
        },
        {
          user: 'super_user',
          role: 'superuser'
        },
        {
          user: 'admin_user',
          role: 'admin'
        }
      ]);
    });
};
