const express = require('express');
const router = express.Router();
const authUtils = require('./authUtils');

router.post('/', async (req, res) => {
    authUtils.authenticateUser(req, res);
});

module.exports = router;
