const express = require('express');
const router = express.Router();
const productStore = require('../db/productStore');
const authMiddleware = require('./authMiddleware');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    try {
        const products = await productStore.findAll();
        const mappedProds = products.map((product) => {
            return {
                barcode: product.barcode,
                productId: product.itemid,
                name: product.descr,
                category: {
                    categoryId: product.pgrpid,
                    description: product.pgrpdescr
                },
                weight: product.weight,
                sellPrice: product.sellprice,
                stock: product.count
            };
        });
        res.status(200).json({
            products: mappedProds
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode(\\d{1,14})', async (req, res) => {
    const barcode = req.params.barcode;

    try {
        const product = await productStore.findByBarcode(barcode);

        if (!product) {
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product does not exist'
            });
            return;
        }

        res.status(200).json({
            product: {
                barcode: product.barcode,
                productId: product.itemid,
                name: product.descr,
                category: {
                    categoryId: product.pgrpid,
                    description: product.pgrpdescr
                },
                weight: product.weight,
                sellPrice: product.sellprice,
                stock: product.count
            }
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
