const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const logger = require('./../../logger');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

var global_margin = 8;

router.get('/', async (req, res) => {
    return res.status(200).json({
        margin: global_margin
    });
});

router.put('/', async (req, res) => {
    logger.info(
        'Changed default margin from ' + global_margin + ' to' + req.body.margin
    );
    global_margin = req.body.margin;
    return res.status(200).json({
        margin: global_margin
    });
});

module.exports = router;
