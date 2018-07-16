const isObject = require('util').isObject;
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
        return res.status(200).json(boxes);
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode(\\d+)', async (req, res) => {
    try {
        const box = await boxStore.findByBoxBarcode(req.params.barcode);

        if (!box) {
            logger.error(
                '%s %s: box with barcode %s was not found',
                req.method,
                req.baseUrl + req.path,
                req.params.barcode
            );
            return res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
        }

        return res.status(200).json(box);
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/:barcode(\\d+)', async (req, res) => {
    try {
        const box = await boxStore.findByBoxBarcode(req.params.barcode);
        const product = await productStore.findById(box.product_id);

        if (!box) {
            logger.warning(
                '%s %s: box with barcode %s was not found',
                req.method,
                req.baseUrl + req.path,
                req.params.barcode
            );
            return res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
        }

        const sellprice = parseInt(req.body.sellprice, 10);
        const buyprice = parseInt(req.body.buyprice, 10);
        const boxes = parseInt(req.body.boxes, 10);

        // validate request
        const reqValidators = [
            validators.nonNegativeNumber('sellprice'),
            validators.nonNegativeNumber('buyprice'),
            validators.positiveNumber('boxes')
        ];

        const errors = fieldValidator.validateObject(req.body, reqValidators);

        if (errors.length > 0) {
            logger.error(
                '%s %s: invalid request by user %s: %s',
                req.method,
                req.baseUrl + req.path,
                req.rvuser.name,
                errors.join(', ')
            );

            return res.status(400).json({
                error_code: 'bad_request',
                message: 'Missing or invalid fields in request',
                errors
            });
        }

        // all good, boxes can be added
        const quantity = product.count + boxes * box.items_per_box;
        await productStore.changeProductStock(box.product_id, buyprice, sellprice, quantity, req.rvuser.userid);

        logger.info(
            '%s %s: user %s added %d boxes (%d pcs) of product %d (box %s, product barcode %s)',
            req.method,
            req.baseUrl + req.path,
            req.rvuser.name,
            boxes,
            box.items_per_box * boxes,
            box.product_id,
            box.box_barcode,
            box.product_barcode
        );

        return res.status(200).json({
            box_barcode: box.box_barcode,
            product_barcode: box.product_barcode,
            product_id: box.product_id,
            product_name: box.product_name,
            quantity_added: box.items_per_box * boxes,
            total_quantity: quantity
        });
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.put('/:barcode(\\d+)', async (req, res) => {
    // validate request
    const boxValidators = [validators.positiveNumber('items_per_box'), validators.anObject('product')];

    const productValidators = [
        validators.numericBarcode('product_barcode'),
        validators.nonEmptyString('product_name'),
        validators.positiveNumber('product_group'),
        validators.positiveNumber('product_weight'),
        validators.nonNegativeNumber('product_sellprice'),
        validators.nonNegativeNumber('product_buyprice')
    ];

    const boxErrors = fieldValidator.validateObject(req.body, boxValidators);
    if (boxErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.baseUrl + req.path,
            req.rvuser.name,
            boxErrors.join(', ')
        );
        return res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors: boxErrors
        });
    }

    const productErrors = fieldValidator.validateObject(req.body.product, productValidators);
    if (productErrors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.baseUrl + req.path,
            req.rvuser.name,
            productErrors.join(', ')
        );
        return res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors: productErrors
        });
    }

    try {
        const productData = req.body.product;
        const box = await boxStore.findByBoxBarcode(req.params.barcode);
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
                    userid: req.rvuser.userid,
                    starttime: new Date(),
                    endtime: null
                },
                req.rvuser.userid
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
                req.rvuser.userid
            );

            await productStore.updateProduct({
                id: product.itemid,
                name: productData.product_name,
                group: productData.product_group,
                weight: productData.product_weight,
                userid: req.rvuser.userid
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
            await boxStore.createBox(
                req.params.barcode,
                productData.product_barcode,
                req.body.items_per_box,
                req.rvuser.userid
            );
            boxCreated = true;

            logger.info(
                '%s %s: created a box with barcode %s for product "%s" (barcode %s)',
                req.method,
                req.originalUrl,
                req.params.barcode,
                productData.product_name,
                productData.product_barcode
            );
        } else {
            await boxStore.updateBox(
                req.params.barcode,
                productData.product_barcode,
                req.body.items_per_box,
                req.rvuser.userid
            );

            logger.info('%s %s: updated box %s', req.method, req.originalUrl, req.params.barcode);
        }

        return res.status(boxCreated ? 201 : 200).json({
            box_barcode: req.params.barcode,
            items_per_box: req.body.items_per_box,
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
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
