const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.rvuser;

    res.status(200).json({
        username: user.name,
        full_name: user.realname,
        email: user.univident,
        account_balance: user.saldo
    });
});

router.post('/debit', async (req, res) => {
    const body = req.body;

    const inputValidators = [validators.positiveInteger('amount')];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const user = req.rvuser;
    const amount = body.amount;

    try {
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
    } catch (error) {
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/credit', async (req, res) => {
    const body = req.body;

    const inputValidators = [validators.positiveInteger('amount')];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const user = req.rvuser;
    const amount = body.amount;

    try {
        user.saldo = await userStore.updateAccountBalance(user.name, amount);
        res.status(200).json({
            account_balance: user.saldo
        });
    } catch (error) {
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
