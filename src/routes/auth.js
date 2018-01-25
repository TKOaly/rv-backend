const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const token = require('../jwt/token');
const knex = require('../db/knex.js');

router.use(function (req, res, next) {
  next();
});

router.post('/', function (req, res) {
  if (req.body.username && req.body.password) {
    var username = req.body.username;
    var password = req.body.password;

    knex('users')
    .where({ username: username })
    .select('username', 'password_hash')
    .then(function (rows) {
      if (rows.length > 0) {
        var pwhash = rows[0].password_hash;
        bcrypt.compare(password, pwhash, function (err, matches) {
          if (matches === true) {
            var roles = [];

            knex.select('role_name')
            .from('user_roles')
            .join('roles', function() {
              this.on('user_roles.role', '=', 'roles.role_name')
              .andOn('user_roles.user', '=', knex.raw('?', [rows[0].username]));
            })
            .then((rows) => {
              roles = rows.map((row) => row.role_name);

              res.status(200).json({
                access_token: token.sign({ username: rows[0].username, roles: roles })
              });
            });
          } else {
            res.status(403).json({
              error_code: 'invalid_credentials',
              message: 'Invalid username or password'
            });
          }
        });
      } else {
        res.status(403).json({
          error_code: 'invalid_credentials',
          message: 'Invalid username or password'
        });
      }
    })
    .catch(function (error) {
      res.status(500).json({
        error_code: 'internal_error',
        message: 'Internal error'
      });
    });

  } else {
    res.status(400).json({ error_code: 'bad_request', message: 'Bad request' });
  }
});

module.exports = router;