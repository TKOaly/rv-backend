const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const productStore = require('../../db/productStore');
const logger = require('winston');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    try {
        var products = await productStore.findAll();

        res.status(200).json({
            products: products.map(product => {
                return {
                    product_id: product.itemid,
                    product_name: product.descr,
                    product_barcode: product.barcode,
                    buyprice: product.buyprice,
                    sellprice: product.sellprice,
                    quantity: parseInt(product.quantity || 0)
                };
            })
        });
    }
    catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
    }
});

router.post('/', async (req, res) => {
    var body = req.body;

    if (!body.barcode.match('(^[0-9]{13})+$')) {
        res.status(400).json({
            error_code: 'Bad _request',
            message: 'not a barcode'
        });
    } else {
        try {
            const product = await productStore.findByBarcode(body.barcode);
            let products = await productStore.findAll();
            const highestId = Math.max(...products.map((product) => product.itemid))

            if (!product) {
                const newProduct = {
                    descr: body.descr,
                    itemid: highestId + 1,
                    pgrpid: body.pgrpid,
                    weight: body.weight
                }
                const newPrice = {
                    barcode: body.barcode,
                    count: body.count,
                    buyprice: body.buyprice,
                    sellprice: body.sellprice,
                    itemid: highestId + 1,
                    userid: 2,
                    starttime: new Date(),
                    endtime: null
                }

                if (Object.values(newProduct).includes(undefined) || Object.values(newPrice).includes(undefined)) {
                    res.status(400).json({
                        message: 'Missing parametres.'
                    });
                }

                const status = await productStore.addProduct(newProduct, newPrice)

                res.status(201).json({
                    product: newProduct,
                    price: newPrice,
                    dbstatus: status
                });
            } else {
                res.status(400).json({ 
                    error_code: 'Product exists',
                    messasge: 'Barcode is already assigned to a product.'     
                });
            }
        } catch (exception) {
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        }
    }
});

router.get('/:barcode', async (req, res) => {
    var barcode = req.params.barcode;

    if (!barcode.match('(^[0-9]{13})+$')) {
        res.status(400).json({
            error_code: 'Bad _request',
            message: 'not a barcode'
        });
    
    } else {
        try {
            const product = await productStore.findByBarcode(barcode);

            if (product) {
                res.status(200).json({
                    product: product
                });
            } else {
                res.status(404).json({ 
                    error_code: 'Not_found',
                    messasge: 'item not found on database'     
                });
            }

        } catch (exception) {
            res.status(500).json({
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
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
            return;
        }

        // check that request is valid
        const errors = [];
        isNaN(buyprice) && errors.push('buyprice should be a number');
        isNaN(sellprice) && errors.push('sellprice should be a number');
        (isNaN(quantity) || quantity <= 0) && errors.push('quantity should be a number > 0');

        if (errors.length > 0) {
            res.status(400).json({
                error_code: 'bad_request',
                message: 'Missing or invalid fields in request',
                errors
            });
            return;
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

        res.status(200).json({
            product_id: parseInt(id, 10),
            buyprice: buyprice,
            sellprice: sellprice,
            quantity: product.count + quantity
        });
    }
    catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
