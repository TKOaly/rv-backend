const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const productStore = require('../../db/productStore');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    var products = await productStore.findAll();

    res.status(200).json({
        products: products.map(product => {
            return {
                product_id: product.itemid,
                product_name: product.descr,
                quantity: parseInt(product.quantity || 0)
            };
        })
    });
});

module.exports = router;
