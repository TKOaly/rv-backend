const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../authUtils');

router.post('/', authenticateUser('ADMIN', process.env.JWT_ADMIN_SECRET));

module.exports = router;
