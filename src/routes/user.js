const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');
const logger = require('../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.rvuser;

    logger.info('User %s fetched user data', user.name);
    res.status(200).json({
        user: {
            username: user.name,
            fullName: user.realname,
            email: user.univident,
            moneyBalance: user.saldo
        }
    });
});

router.patch('/', async (req, res) => {
    const inputValidators = [
        validators.nonEmptyString('username'),
        validators.nonEmptyString('fullName'),
        validators.nonEmptyString('email')
    ];

    const errors = fieldValidator.validateOptionalFields(req.body, inputValidators);
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
    const username = req.body.username;
    const fullName = req.body.fullName;
    const email = req.body.email;

    try {
        // Check if user, email exists
        if (username !== undefined) {
            const userByUsername = await userStore.findByUsername(username);
            if (userByUsername) {
                logger.error('User %s tried to change username to %s but it was taken', user.name, username);
                res.status(409).json({
                    error_code: 'identifier_taken',
                    message: 'Username already in use.'
                });
                return;
            }
        }
        if (email !== undefined) {
            const userByEmail = await userStore.findByEmail(email);
            if (userByEmail) {
                logger.error(
                    'User %s tried to change email from %s to %s but it was taken',
                    user.name,
                    user.univident,
                    email
                );
                res.status(409).json({
                    error_code: 'identifier_taken',
                    message: 'Email address already in use.'
                });
                return;
            }
        }

        if (username !== undefined) {
            await userStore.updateUsername(user.userid, username);
        }
        if (fullName !== undefined) {
            await userStore.updateFullName(user.userid, fullName);
        }
        if (email !== undefined) {
            await userStore.updateEmail(user.userid, email);
        }

        logger.info(
            'User %s changed user data from {%s, %s, %s} to {%s, %s, %s}',
            user.name,
            user.name,
            user.realname,
            user.univident,
            username,
            fullName,
            email
        );
        res.status(200).json({
            user: {
                username: username !== undefined ? username : user.name,
                fullName: fullName !== undefined ? fullName : user.realname,
                email: email !== undefined ? email : user.univident,
                moneyBalance: user.saldo
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/deposit', async (req, res) => {
    const inputValidators = [validators.positiveInteger('amount')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
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
    const amount = req.body.amount;

    try {
        const insertedEventPair = await userStore.recordDeposit(user.userid, amount, user.saldo);

        logger.info('User %s deposited %s cents', user.name, amount);
        res.status(200).json({
            accountBalance: user.saldo + amount,
            deposit: {
                depositId: insertedEventPair.personEvent.pershistid,
                time: new Date(insertedEventPair.personEvent.time).toISOString(),
                amount: insertedEventPair.saldoEvent.difference,
                balanceAfter: insertedEventPair.saldoEvent.saldo
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/changePassword', async (req, res) => {
    const inputValidators = [validators.nonEmptyString('password')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
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
    const password = req.body.password;

    try {
        await userStore.updatePassword(user.userid, password);

        logger.info('User %s changed password', user.name);
        res.status(204).end();
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
