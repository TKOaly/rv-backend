const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');
const logger = require('../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');
const deleteUndefinedFields = require('../utils/objectUtils').deleteUndefinedFields;

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.user;

    logger.info('User %s fetched user data', user.username);
    res.status(200).json({
        user: {
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            moneyBalance: user.moneyBalance,
            role: user.role
        }
    });
});

router.patch('/', async (req, res) => {
    const user = req.user;

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
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const username = req.body.username;
    const fullName = req.body.fullName;
    const email = req.body.email;

    try {
        // Check if user, email exists
        if (username !== undefined) {
            const userByUsername = await userStore.findByUsername(username);
            if (userByUsername) {
                logger.error('User %s tried to change username to %s but it was taken', user.username, username);
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
                    user.username,
                    user.email,
                    email
                );
                res.status(409).json({
                    error_code: 'identifier_taken',
                    message: 'Email address already in use.'
                });
                return;
            }
        }

        const updatedUser = await userStore.updateUser(
            user.userId,
            deleteUndefinedFields({ username: username, fullName: fullName, email: email })
        );

        logger.info(
            'User %s changed user data from {%s, %s, %s} to {%s, %s, %s}',
            user.username,
            user.username,
            user.fullName,
            user.email,
            updatedUser.username,
            updatedUser.fullName,
            updatedUser.email
        );
        res.status(200).json({
            user: {
                userId: updatedUser.userId,
                username: updatedUser.username,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                moneyBalance: updatedUser.moneyBalance,
                role: updatedUser.role
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
    const user = req.user;

    const inputValidators = [validators.positiveInteger('amount')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const amount = req.body.amount;

    try {
        const deposit = await userStore.recordDeposit(user.userId, amount);

        logger.info('User %s deposited %s cents', user.username, amount);
        res.status(200).json({
            accountBalance: deposit.balanceAfter,
            deposit: {
                depositId: deposit.depositId,
                time: deposit.time,
                amount: deposit.amount,
                balanceAfter: deposit.balanceAfter
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
    const user = req.user;

    const inputValidators = [validators.nonEmptyString('password')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const password = req.body.password;

    try {
        await userStore.updateUser(user.userId, { password: password });

        logger.info('User %s changed password', user.username);
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
