const knex = require('./knex');
const bcrypt = require('bcrypt');

module.exports.findByUsername = (username) => {
  return knex('users')
  .where({ username: username })
  .select('*')
  .then((rows) => {
    return rows.length > 0 ? rows[0] : null;
  });
}

module.exports.verifyPassword = (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
}

module.exports.findUserRoles = (username) => {
  return knex.select('role_name')
  .from('user_roles')
  .join('roles', function() {
    this.on('user_roles.role', '=', 'roles.role_name')
    .andOn('user_roles.user', '=', knex.raw('?', [username]));
  })
  .then((rows) => {
    return rows.map((row) => row.role_name);
  });
}

module.exports.updateAccountBalance = (username, balance) => {
  return knex('users')
  .where('username', '=', username)
  .update({
    account_balance: balance
  });
}