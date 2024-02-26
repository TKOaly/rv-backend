const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateUserRfid } = require('./authUtils');

router.post('/', authenticateUser());
router.post('/rfid', authenticateUserRfid());

module.exports = router;
