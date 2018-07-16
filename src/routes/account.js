const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');

const logger = require('./../logger');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.rvuser;

    return res.status(200).json({
        username: user.name,
        full_name: user.realname,
        email: user.univident,
        account_balance: user.saldo
    });
});

router.post('/debit', async (req, res) => {
    try {
        const user = req.rvuser;
        const amount = parseInt(req.body.amount, 10);

        if (!isNaN(amount) && amount > 0) {
            if (user.saldo > 0) {
                user.saldo = await userStore.updateAccountBalance(user.name, -amount);
                return res.status(200).json({
                    account_balance: user.saldo
                });
            } else {
                return res.status(403).json({
                    error_code: 'insufficient_funds',
                    message: 'Insufficient funds'
                });
            }
        } else {
            return res.status(400).json({
                error_code: 'bad_request',
                message: 'Bad request'
            });
        }
    } catch (error) {
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/credit', async (req, res) => {
    try {
        const user = req.rvuser;
        const amount = parseInt(req.body.amount, 10);

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
    } catch (error) {
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
