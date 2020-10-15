const express = require('express');
const router = express.Router();
const { authenticateUser } = require('./authUtils');

router.post('/', authenticateUser());

module.exports = router;
