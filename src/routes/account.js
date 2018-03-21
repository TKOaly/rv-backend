const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    var user = req.rvuser;

    res.status(200).json({
        username: user.name,
        full_name: user.realname,
        email: user.univident,
        account_balance: user.saldo
    });
});

router.post('/debit', async (req, res) => {
    try {
        var user = req.rvuser;
        var amount = parseInt(req.body.amount, 10);

        if (!isNaN(amount) && amount > 0) {
            if (user.saldo > 0) {
                user.saldo = await userStore.updateAccountBalance(user.name, -amount);
                res.status(200).json({
                    account_balance: user.saldo
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
    }
    catch (error) {
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/credit', async (req, res) => {
    try {
        var user = req.rvuser;
        var amount = parseInt(req.body.amount, 10);

        if (!isNaN(amount) && amount > 0) {
            user.saldo = await userStore.updateAccountBalance(user.name, amount);
            res.status(200).json({
                account_balance: user.saldo
            });
        } else {
            res.status(400).json({
                error_code: 'bad_request',
                message: 'Bad request'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;