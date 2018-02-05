const express = require('express');
const router = express.Router();
const token = require('../jwt/token');
const knex = require('../db/knex');
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');

router.use(authMiddleware);

router.get('/', (req, res) => {
    userStore.findByUsername(req.rvusername)
        .then((user) => {
            if (user) {
                res.status(200).json({
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    account_balance: user.account_balance
                });
            } else {
                res.status(404).json({
                    error_code: 'not_found',
                    message: 'Not found'
                });
            }
        })
        .catch((error) => {
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        });
});

router.post('/debit', (req, res) => {
    userStore.findByUsername(req.rvusername)
        .then((user) => {
            if (user) {
                var amount = parseInt(req.body.amount, 10);
                if (!isNaN(amount) && amount > 0) {
                    if (user.account_balance > 0) {
                        user.account_balance -= amount;
                        userStore.updateAccountBalance(user.username, user.account_balance)
                            .then((result) => {
                                res.status(200).json({
                                    account_balance: user.account_balance
                                });
                            });
                    } else {
                        res.status(403).json({
                            error_code: 'insufficient_funds',
                            message: 'Insufficient funds'
                        });
                    }
                } else {
                    res.status(400).json({
                        error_code: 'bad_request',
                        message: 'Bad request'
                    });
                }
            } else {
                res.status(404).json({
                    error_code: 'not_found',
                    message: 'Not found'
                });
            }
        })
        .catch((error) => {
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        });
});

router.post('/credit', (req, res) => {
    userStore.findByUsername(req.rvusername)
        .then((user) => {
            if (user) {
                var amount = parseInt(req.body.amount, 10);
                if (!isNaN(amount) && amount > 0) {
                    user.account_balance += amount;
                    userStore.updateAccountBalance(user.username, user.account_balance)
                        .then((result) => {
                            res.status(200).json({
                                account_balance: user.account_balance
                            });
                        });
                } else {
                    res.status(400).json({
                        error_code: 'bad_request',
                        message: 'Bad request'
                    });
                }
            } else {
                res.status(404).json({
                    error_code: 'not_found',
                    message: 'Not found'
                });
            }
        })
        .catch((error) => {
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        });
});

module.exports = router;