const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

router.get('/product/:productId(\\d+)', async (req, res) => {
    try {
        const product = await productStore.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
    }
});

router.get('/', async (req, res) => {
    try {
        var products = await productStore.findAll();
        const prods = products.map(product => {
            return {
                product_id: product.itemid,
                product_name: product.descr,
                product_barcode: product.barcode,
                buyprice: product.buyprice,
                sellprice: product.sellprice,
                quantity: parseInt(product.quantity || 0)
            };
        });
        return res.status(200).json({
            products: prods
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
    }
});

router.post('/', async (req, res) => {
    var body = req.body;
    try {
        const barcodeRegex = await body.barcode.match('(^[0-9]{13})+$');
        if (!barcodeRegex) {
            return res.status(400).json({
                error_code: 'Bad _request',
                message: 'not a barcode'
            });
        } else {
            const product = await productStore.findByBarcode(body.barcode);
            let products = await productStore.findAll();
            const highestId = Math.max(
                ...products.map(product => product.itemid)
            );

            if (!product) {
                const newProduct = {
                    descr: body.descr,
                    itemid: highestId + 1,
                    pgrpid: body.pgrpid,
                    weight: body.weight
                };
                const newPrice = {
                    barcode: body.barcode,
                    count: body.count,
                    buyprice: body.buyprice,
                    sellprice: body.sellprice,
                    itemid: highestId + 1,
                    userid: 2,
                    starttime: new Date(),
                    endtime: null
                };

                if (
                    Object.values(newProduct).includes(undefined) ||
                    Object.values(newPrice).includes(undefined)
                ) {
                    return res.status(400).json({
                        message: 'Missing parametres.'
                    });
                }

                const status = await productStore.addProduct(
                    newProduct,
                    newPrice
                );

                return res.status(201).json({
                    product: newProduct,
                    price: newPrice,
                    dbstatus: status
                });
            } else {
                logger.error(
                    'Barcode %s is already assigned to product %s',
                    product.barcode,
                    product.product_name
                );
                return res.status(400).json({
                    error_code: 'Product exists',
                    messasge: 'Barcode is already assigned to a product.'
                });
            }
        }
    } catch (exception) {
        logger.error(
            'Error at %s: %s',
            req.baseUrl + req.path,
            exception.stack
        );
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode', async (req, res) => {
    var barcode = req.params.barcode;

    if (!barcode.match('(^[0-9]{13})+$')) {
        logger.error('Bad barcode: ' + barcode);
        return res.status(400).json({
            error_code: 'Bad _request',
            message: 'not a barcode'
        });
    } else {
        try {
            const product = await productStore.findByBarcode(barcode);

            if (product) {
                return res.status(200).json({
                    product: product
                });
            } else {
                return res.status(404).json({
                    error_code: 'Not_found',
                    messasge: 'item not found on database'
                });
            }
        } catch (exception) {
            logger.error(
                'Error at %s: %s',
                req.baseUrl + req.path,
                exception.stack
            );
            return res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        }
    }
});

router.post('/product/:id(\\d+)', async (req, res) => {
    const id = req.params.id;
    const buyprice = parseInt(req.body.buyprice, 10);
    const sellprice = parseInt(req.body.sellprice, 10);
    const quantity = parseInt(req.body.quantity, 10);

    try {
        // check that product exists
        const product = await productStore.findById(id);
        if (!product) {
            logger.error(
                'User tried to do a buy-in for product that does not exist.'
            );
            return res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
        }

        // check that request is valid
        const errors = [];
        isNaN(buyprice) && errors.push('buyprice should be a number');
        isNaN(sellprice) && errors.push('sellprice should be a number');
        (isNaN(quantity) || quantity <= 0) &&
            errors.push('quantity should be a number > 0');

        if (errors.length > 0) {
            logger.error(
                'Errors occured while doing a buy-in: ' + JSON.stringify(errors)
            );
            return res.status(400).json({
                error_code: 'bad_request',
                message: 'Missing or invalid fields in request',
                errors
            });
        }

        // update information
        await productStore.changeProductStock(
            product.itemid,
            buyprice,
            sellprice,
            product.count + quantity,
            req.rvuser.userid
        );

        // return updated information
        logger.info(
            'Successful buy-in of ' +
                quantity +
                ' pcs of Product #' +
                parseInt(id, 10)
        );
        return res.status(200).json({
            product_id: parseInt(id, 10),
            buyprice: buyprice,
            sellprice: sellprice,
            quantity: product.count + quantity
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
