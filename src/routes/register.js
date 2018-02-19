const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore'); // not used

const neededKeys = ["username", "password", "realname", "email"]

// Register a new user
router.post('/', async (req, res) => {
    //const newAccount = req.body;
    
    //const errors = []


    const newAccountKeys = Object.keys(req.body)
    const missingKeys = neededKeys.filter((key) => {
        return !newAccountKeys.includes(key);
    })

    if (missingKeys.length > 0) {
        res.status(400).json({
            error: `Missing: ${missingKeys.join()}`
        }).end();
    }

    // remove
  //  if (req.body.username.length < 4) {
//
    //} 

    res.status(200).json(missingKeys);
});

module.exports = router;