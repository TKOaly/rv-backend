const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore'); // not used

const neededKeys = ["username", "password", "realname", "email"]

// Register a new user
router.post('/', async (req, res) => {
    const body = req.body;
    
    // Missing fields
    const newAccountKeys = Object.keys(body)
    const missingKeys = neededKeys.filter((key) => {
        return !newAccountKeys.includes(key);
    })
    if (missingKeys.length > 0) {
        res.status(400).json({
            error: `Missing: ${missingKeys.join()}`
        }).end();
        return;
    }

    // Check username, password length
    if (body.username.length < 4) {
        res.status(400).json({
            error: `Username has at least 4 characters.`
        }).end();
        return;
    } else if (body.password.length < 4) {
        res.status(400).json({
            error: `Password has at least 4 characters.`
        }).end();
        return;
    }

    // Check if user, email exists
    const user = await userStore.findByUsername(body.username);
    if (user) {
        res.status(403).json({
            error: `Username already in use.`
        }).end();
        return;
    }
    const userEmail = await userStore.findByEmail(body.email);
    if (userEmail) {
        res.status(403).json({
            error: `Email already in use.`
        }).end();
        return;
    }

    // All ok

    // Add user to db
    try {
        const inserted = await userStore.insertUser(body);
        res.status(201).json(inserted);
    } catch (exception) {
        res.status(500).json({
            error_code: 'internal_error',
            message: exception
        });
    }
    
    // for debugging
    // console.log(await userStore.getUsers())
});

module.exports = router;