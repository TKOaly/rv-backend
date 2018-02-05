const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const token = require('../jwt/token');
const knex = require('../db/knex');
const userStore = require('../db/userStore');

router.use((req, res, next) => {
    next();
});

router.post('/', (req, res) => {
    if (req.body.username && req.body.password) {
        var username = req.body.username;
        var password = req.body.password;

        userStore.findByUsername(username)
            .then((user) => {
                if (user) {
                    userStore.verifyPassword(password, user.password_hash)
                        .then((match) => {
                            if (match === true) {
                                userStore.findUserRoles(user.username).then((roles) => {
                                    res.status(200).json({
                                        access_token: token.sign({ username: user.username, roles: roles })
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
            .catch((error) => {
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