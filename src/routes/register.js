const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

// Register a new user
router.post('/', async (req, res) => {
    const body = req.body;

    const inputValidators = [
        validators.nonEmptyString('username'),
        validators.nonEmptyString('password'),
        validators.nonEmptyString('fullName'),
        validators.nonEmptyString('email')
    ];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error('%s %s: invalid request: %s', req.method, req.originalUrl, errors.join(', '));
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const username = body.username;
    const password = body.password;
    const fullName = body.fullName;
    const email = body.email;

    try {
        // Check if user, email exists
        const userByUsername = await userStore.findByUsername(username);
        if (userByUsername) {
            res.status(409).json({
                error_code: 'identifier_taken',
                message: 'Username already in use.'
            });
            return;
        }
        const userByEmail = await userStore.findByEmail(email);
        if (userByEmail) {
            res.status(409).json({
                error_code: 'identifier_taken',
                message: 'Email address already in use.'
            });
            return;
        }

        // Add user to db
        await userStore.insertUser({
            username,
            password,
            realname: fullName,
            email
        });
        logger.info('Registered new user: ' + username);
        res.status(201).json({
            user: {
                username,
                fullName,
                email,
                moneyBalance: 0
            }
        });
    } catch (exception) {
        logger.info('Error registering new user: ' + exception);
        res.status(500).json({
            error_code: 'internal_error',
            message: exception
        });
    }
});

module.exports = router;
