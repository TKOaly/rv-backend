const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore'); // not used

// Purchase product, returns 200 ok and what you sent
router.post('/', async (req, res) => {
    var newPurchase = req.body;

    res.status(200).json({
        barcode: newPurchase.barcode,
        price: newPurchase.price,
        product_name: newPurchase.product_name 
    });
});

module.exports = router;