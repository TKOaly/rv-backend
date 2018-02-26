const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const productStore = require('../db/productStore');
const authMiddleware = require('./authMiddleware');

router.use(authMiddleware);

router.post('/', async (req, res) => {
    var barcode = req.body.barcode;
    var quantity = parseInt(req.body.quantity, 10);

    // verify that barcode and quantity are valid
    if (barcode && !isNaN(quantity) && quantity > 0) {
        try {
            var product = await productStore.findByBarcode(barcode);

            // product and price found
            if (product !== null) {
                res.status(200).json({
                    product_name: product.descr,
                    quantity: quantity,
                    account_balance: 0
                });
            } else { // product not found or no valid price for product
                res.status(404).json({
                    error_code: 'product_not_found',
                    message: 'Product not found'
                });
            }
        }
        catch (error) { // other errors
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        }
    } else { // invalid request
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request'
        });
    }
});

module.exports = router;