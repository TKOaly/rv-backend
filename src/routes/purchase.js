const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const productStore = require('../db/productStore');
const authMiddleware = require('./authMiddleware');

router.use(authMiddleware());

router.post('/', async (req, res) => {
    var barcode = req.body.barcode;
    var quantity = parseInt(req.body.quantity, 10);

    // verify that barcode and quantity are valid
    if (barcode && !isNaN(quantity) && quantity > 0) {
        try {
            var product = await productStore.findByBarcode(barcode);
            var user = req.rvuser;

            // product and price found
            if (product !== null && product.count >= quantity) {

                // user has enough money to purchase
                if (user.saldo > 0) {

                    // record purchase
                    await productStore.addPurchase(
                        product.itemid,
                        product.priceid, 
                        user.userid, 
                        product.count - quantity
                    );

                    // update account balance
                    const newBalance = await userStore.updateAccountBalance(user.name, -quantity * product.sellprice);
                    
                    // all done, respond with success
                    res.status(200).json({
                        product_name: product.descr,
                        quantity: quantity,
                        price: product.sellprice,
                        account_balance: newBalance
                    });
                } else {
                    // user doesn't have enough money
                    res.status(403).json({
                        error_code: 'insufficient_funds',
                        message: 'Insufficient funds'
                    });
                }
            } else { 
                // unknown product, no valid price or out of stock
                res.status(404).json({
                    error_code: 'product_not_found',
                    message: 'Product not found'
                });
            }
        }
        catch (error) {
            // other errors
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