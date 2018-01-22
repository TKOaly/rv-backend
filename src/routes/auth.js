const express = require('express')
const router = express.Router();
var userdata = require('../userdata');
const bcrypt = require('bcrypt');
const token = require('../jwt/token');
const knex = require('../db/knex.js');

router.use(function (req, res, next) {
  next();
});

router.post('/authenticate', function (req, res) {
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
            res.status(200).json({
              access_token: token.sign({ username: rows[0].username })
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