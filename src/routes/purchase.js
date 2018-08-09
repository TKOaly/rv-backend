const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const productStore = require('../db/productStore');
const authMiddleware = require('./authMiddleware');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

router.use(authMiddleware());

router.post('/', async (req, res) => {
    const body = req.body;

    const inputValidators = [validators.numericBarcode('barcode'), validators.positiveInteger('quantity')];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const barcode = body.barcode;
    const quantity = body.quantity;
    const user = req.rvuser;

    try {
        const product = await productStore.findByBarcode(barcode);

        // product and price found
        if (product) {
            // user has enough money to purchase
            if (user.saldo > 0) {
                // record purchase
                await productStore.addPurchase(product.itemid, product.priceid, user.userid, product.count - quantity);

                // update account balance
                const newBalance = await userStore.updateAccountBalance(user.name, -quantity * product.sellprice);
                logger.info('User #' + user.userid + ' purchased ' + quantity + ' x item #' + product.itemid);
                // all done, respond with success
                res.status(200).json({
                    product_name: product.descr,
                    quantity: quantity,
                    price: product.sellprice,
                    account_balance: newBalance
                });
            } else {
                logger.error(
                    'User #' +
                        user.userid +
                        ' tried to purchase ' +
                        quantity +
                        ' x item #' +
                        product.itemid +
                        ' but the user didn\'t have enough money.'
                );
                // user doesn't have enough money
                res.status(403).json({
                    error_code: 'insufficient_funds',
                    message: 'Insufficient funds'
                });
            }
        } else {
            logger.error('User #' + user.userid + ' tried to purchase a product that does not exist.');
            // unknown product, no valid price or out of stock
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
        }
    } catch (error) {
        logger.error('Database error when trying to purchase a product: ' + error);
        // other errors
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
