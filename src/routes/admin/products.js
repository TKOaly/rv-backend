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

router.get('/:barcode', async (req, res) => {
    try {
        const product = await productStore.findByBarcode(req.params.barcode)  
        if(product) {
            res.status(200).json({
            product: product
            });
    } else {
            res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
            });
        }
    } catch (exception) {
        res.status(400).send({ error: 'malformatted id' })
    }
})

module.exports = router;
