const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore'); // not used
const logger = require('./../logger');

const neededKeys = ['username', 'password', 'realname', 'email'];

// Register a new user
router.post('/', async (req, res) => {
    const body = req.body;

    // Missing fields
    const newAccountKeys = Object.keys(body);
    const missingKeys = neededKeys.filter((key) => {
        return !newAccountKeys.includes(key);
    });
    if (missingKeys.length > 0) {
        res.status(400)
            .json({
                error_code: 'bad_request',
                message: `Missing: ${missingKeys.join()}`
            })
            .end();
        return;
    }

    // Check username, password length
    if (body.username.length === 0) {
        res.status(400)
            .json({
                error_code: 'bad_request',
                message: 'Username is empty.'
            })
            .end();
        return;
    } else if (body.password.length === 0) {
        res.status(400)
            .json({
                error_code: 'bad_request',
                message: 'Password is empty.'
            })
            .end();
        return;
    }

    // Check if user, email exists
    const user = await userStore.findByUsername(body.username);
    if (user) {
        return res
            .status(403)
            .json({
                error_code: 'identifier_taken',
                message: 'Username is already in use.'
            })
            .end();
    }
    const userEmail = await userStore.findByEmail(body.email.trim());
    if (userEmail) {
        return res
            .status(403)
            .json({
                error_code: 'identifier_taken',
                message: 'Email address already in use.'
            })
            .end();
    }

    // All ok

    // Add user to db
    try {
        const highestId = await userStore.findHighestUserId();
        const inserted = await userStore.insertUser(body, highestId.max);
        logger.info('Registered new user: ' + body.username);
        return res.status(201).json(inserted);
    } catch (exception) {
        logger.info('Error registering new user: ' + exception);
        return res.status(500).json({
            error_code: 'internal_error',
            message: exception
        });
    }

    // for debugging
    // console.log(await userStore.getUsers())
});

module.exports = router;
