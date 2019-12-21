const express = require('express');
const router = express.Router();
const productStore = require('../db/productStore');
const authMiddleware = require('./authMiddleware');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.user;

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

        logger.info('User %s fetched products', user.username);
        res.status(200).json({
            products: mappedProds
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode(\\d{1,14})', async (req, res) => {
    const user = req.user;
    const barcode = req.params.barcode;

    try {
        const product = await productStore.findByBarcode(barcode);

        if (!product) {
            logger.error('User %s tried to fetch unknown product %s', user.username, barcode);
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product does not exist'
            });
            return;
        }

        logger.info('User %s fetched product %s', user.username, barcode);
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
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/:barcode(\\d{1,14})/purchase', async (req, res) => {
    const user = req.user;

    const inputValidators = [validators.positiveInteger('count')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const barcode = req.params.barcode;
    const count = req.body.count;

    try {
        const product = await productStore.findByBarcode(barcode);

        // product and price found
        if (product) {
            /* User can always empty his account completely, but resulting negative saldo should be minimized. This is
             * achieved by allowing only a single product to be bought on credit. */
            if (product.sellprice <= 0 || user.moneyBalance > product.sellprice * (count - 1)) {
                // record purchase
                const insertedHistory = await productStore.recordPurchase(
                    product.itemid,
                    product.priceid,
                    user.userId,
                    count,
                    product.sellprice,
                    product.count,
                    user.moneyBalance
                );

                const newBalance = user.moneyBalance - count * product.sellprice;
                const newStock = product.count - count;

                const newPurchases = insertedHistory.map((eventPair) => {
                    return {
                        purchaseId: eventPair.itemEvent.itemhistid,
                        time: new Date(eventPair.itemEvent.time).toISOString(),
                        product: {
                            barcode: product.barcode,
                            productId: product.itemid,
                            name: product.descr,
                            category: {
                                categoryId: product.pgrpid,
                                description: product.pgrpdescr
                            },
                            weight: product.weight
                        },
                        price: product.sellprice,
                        balanceAfter: eventPair.saldoEvent.saldo
                    };
                });

                // all done, respond with success
                logger.info('User %s purchased %s x product %s', user.username, count, barcode);
                res.status(200).json({
                    accountBalance: newBalance,
                    productStock: newStock,
                    purchases: newPurchases
                });
            } else {
                // user doesn't have enough money
                logger.error(
                    'User %s tried to purchase %s x product %s but didn\'t have enough money.',
                    user.username,
                    count,
                    barcode
                );
                res.status(403).json({
                    error_code: 'insufficient_funds',
                    message: 'Insufficient funds'
                });
            }
        } else {
            // unknown product, no valid price or out of stock
            logger.error('User %s tried to purchase unknown product %s', user.username, barcode);
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
        }
    } catch (error) {
        // other errors
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
