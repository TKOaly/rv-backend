const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore'); // not used

// Register a new user
router.post('/', async (req, res) => {
    var newAccount = req.body;

    res.status(200).json({
        username: newAccount.username,
        password: newAccount.password,
        realname: newAccount.realname,
        email: newAccount.email
    });
});

module.exports = router;