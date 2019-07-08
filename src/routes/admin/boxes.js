const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const boxStore = require('../../db/boxStore');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');
const fieldValidator = require('./../../utils/fieldValidator');
const validators = require('../../utils/validators');

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    try {
        const boxes = await boxStore.findAll();
        res.status(200).json({
            boxes: boxes
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode(\\d+)', async (req, res) => {
    const params = req.params;

    const paramValidators = [validators.numericBarcode('barcode')];

    const errors = fieldValidator.validateObject(params, paramValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(404).json({
            error_code: 'box_not_found',
            message: 'Box with invalid gtin code does not exist'
        });
        return;
    }

    const barcode = params.barcode;

    try {
        const box = await boxStore.findByBoxBarcode(barcode);

        if (!box) {
            logger.error('%s %s: box with barcode %s was not found', req.method, req.baseUrl + req.path, barcode);
            res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
            return;
        }

        res.status(200).json({
            box: box
        });
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/:barcode(\\d+)', async (req, res) => {
    const params = req.params;
    const body = req.body;

    const paramValidators = [validators.numericBarcode('barcode')];
    const inputValidators = [
        validators.nonNegativeInteger('sellprice'),
        validators.nonNegativeInteger('buyprice'),
        validators.positiveInteger('boxes')
    ];

    const paramErrors = fieldValidator.validateObject(params, paramValidators);
    if (paramErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            paramErrors.join(', ')
        );
        res.status(404).json({
            error_code: 'box_not_found',
            message: 'Box with invalid gtin code does not exist'
        });
        return;
    }

    const fieldErrors = fieldValidator.validateObject(body, inputValidators);
    if (fieldErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            fieldErrors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            fieldErrors
        });
        return;
    }

    const user = req.rvuser;
    const barcode = params.barcode;
    const sellprice = body.sellprice;
    const buyprice = body.buyprice;
    const boxes = body.boxes;

    try {
        const box = await boxStore.findByBoxBarcode(barcode);
        const product = await productStore.findById(box.product_id);

        if (!box) {
            logger.warning('%s %s: box with barcode %s was not found', req.method, req.baseUrl + req.path, barcode);
            res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
            return;
        }

        // all good, boxes can be added
        const quantity = product.count + boxes * box.items_per_box;
        await productStore.changeProductStock(box.product_id, buyprice, sellprice, quantity, user.userid);

        logger.info(
            '%s %s: user %s added %d boxes (%d pcs) of product %d (box %s, product barcode %s)',
            req.method,
            req.baseUrl + req.path,
            user.name,
            boxes,
            box.items_per_box * boxes,
            box.product_id,
            box.box_barcode,
            box.product_barcode
        );

        res.status(200).json({
            box_barcode: box.box_barcode,
            product_barcode: box.product_barcode,
            product_id: box.product_id,
            product_name: box.product_name,
            quantity_added: box.items_per_box * boxes,
            total_quantity: quantity
        });
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.put('/:barcode(\\d+)', async (req, res) => {
    const params = req.params;
    const body = req.body;

    const paramValidators = [validators.numericBarcode('barcode')];
    const inputValidators = [
        validators.positiveInteger('items_per_box'),
        validators.objectWithFields('product', [
            validators.numericBarcode('product_barcode'),
            validators.nonEmptyString('product_name'),
            validators.integer('product_group'),
            validators.nonNegativeInteger('product_weight'),
            validators.nonNegativeInteger('product_sellprice'),
            validators.nonNegativeInteger('product_buyprice')
        ])
    ];

    const paramErrors = fieldValidator.validateObject(params, paramValidators);
    if (paramErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            paramErrors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Invalid gtin code in request'
        });
        return;
    }

    const fieldErrors = fieldValidator.validateObject(body, inputValidators);
    if (fieldErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            fieldErrors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            fieldErrors
        });
        return;
    }

    const user = req.rvuser;
    const barcode = params.barcode;
    const items_per_box = body.items_per_box;
    const productData = body.product;

    try {
        const box = await boxStore.findByBoxBarcode(barcode);
        let product = await productStore.findByBarcode(productData.product_barcode);
        let boxCreated = false;

        // create or update box and product

        if (!product) {
            const prodId = await productStore.addProduct(
                {
                    descr: productData.product_name,
                    pgrpid: productData.product_group,
                    weight: productData.product_weight
                },
                {
                    barcode: productData.product_barcode,
                    count: 0,
                    buyprice: productData.product_buyprice,
                    sellprice: productData.product_sellprice,
                    userid: user.userid,
                    starttime: new Date(),
                    endtime: null
                },
                user.userid
            );

            logger.info(
                '%s %s: created product "%s" with id %s and barcode %s',
                req.method,
                req.originalUrl,
                productData.product_name,
                prodId,
                productData.product_barcode
            );
        } else {
            // update product info and price
            await productStore.changeProductStock(
                product.itemid,
                productData.product_buyprice,
                productData.product_sellprice,
                product.count,
                user.userid
            );

            await productStore.updateProduct({
                id: product.itemid,
                name: productData.product_name,
                group: productData.product_group,
                weight: productData.product_weight,
                userid: user.userid
            });

            logger.info(
                '%s %s: updated product "%s" (barcode %s)',
                req.method,
                req.originalUrl,
                productData.product_name,
                productData.product_barcode
            );
        }

        product = await productStore.findByBarcode(productData.product_barcode);

        if (!box) {
            await boxStore.createBox(barcode, productData.product_barcode, items_per_box, user.userid);
            boxCreated = true;

            logger.info(
                '%s %s: created a box with barcode %s for product "%s" (barcode %s)',
                req.method,
                req.originalUrl,
                barcode,
                productData.product_name,
                productData.product_barcode
            );
        } else {
            await boxStore.updateBox(barcode, productData.product_barcode, items_per_box, user.userid);

            logger.info('%s %s: updated box %s', req.method, req.originalUrl, barcode);
        }

        res.status(boxCreated ? 201 : 200).json({
            box_barcode: barcode,
            items_per_box: items_per_box,
            product: {
                product_id: product.itemid,
                product_name: product.descr,
                product_group: product.pgrpid,
                product_barcode: product.barcode,
                product_weight: product.weight,
                product_sellprice: product.sellprice,
                product_buyprice: product.buyprice
            }
        });
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
