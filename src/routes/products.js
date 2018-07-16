const express = require('express');
const router = express.Router();
const productStore = require('../db/productStore');
const logger = require('winston');

router.get('/', async (req, res) => {
    try {
        const products = await productStore.findAll();
        const prods = products.map((product) => {
            return {
                product_id: product.itemid,
                product_name: product.descr,
                product_barcode: product.barcode,
                product_group: product.pgrpid,
                buyprice: product.buyprice,
                sellprice: product.sellprice,
                weight: product.weight,
                quantity: parseInt(product.quantity || 0)
            };
        });
        return res.status(200).json({
            products: prods
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
