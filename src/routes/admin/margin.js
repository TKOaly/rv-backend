const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

var global_margin = 8

router.get('/', async (req, res) => {
    res.status(200).json({
        margin: global_margin
    });
});

router.put('/', async (req, res) => {
    global_margin = req.body.margin

    res.status(200).json({
        margin: global_margin
    });
});

module.exports = router;
