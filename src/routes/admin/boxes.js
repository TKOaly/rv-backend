const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const boxStore = require('../../db/boxStore');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');
const fieldValidator = require('./../../utils/fieldValidator');
const validators = require('../../utils/validators');

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    try {
        const boxes = await boxStore.getBoxes();
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
    const user = req.user;
    const params = req.params;

    const paramValidators = [validators.numericBarcode('barcode')];

    const errors = fieldValidator.validateObject(params, paramValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
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
    const user = req.user;
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
            user.username,
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
            user.username,
            fieldErrors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            fieldErrors
        });
        return;
    }

    const barcode = params.barcode;
    const sellPrice = body.sellprice;
    const buyPrice = body.buyprice;
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
        const stock = product.stock + boxes * box.items_per_box;
        await productStore.updateProduct(product.barcode, { buyPrice, sellPrice, stock }, user.userId);

        logger.info(
            '%s %s: user %s added %d boxes (%d pcs) of product %d (box %s, product barcode %s)',
            req.method,
            req.baseUrl + req.path,
            user.username,
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
            total_quantity: stock
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
    const user = req.user;
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
            user.username,
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
            user.username,
            fieldErrors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            fieldErrors
        });
        return;
    }

    const barcode = params.barcode;
    const items_per_box = body.items_per_box;
    const productData = body.product;

    try {
        const box = await boxStore.findByBoxBarcode(barcode);
        let product = await productStore.findByBarcode(productData.product_barcode);
        let boxCreated = false;

        // create or update box and product

        if (!product) {
            const newProduct = await productStore.insertProduct(
                {
                    name: productData.product_name,
                    categoryId: productData.product_group,
                    weight: productData.product_weight,
                    barcode: productData.product_barcode,
                    stock: 0,
                    buyPrice: productData.product_buyprice,
                    sellPrice: productData.product_sellprice
                },
                user.userId
            );

            logger.info(
                '%s %s: created product "%s" with id %s and barcode %s',
                req.method,
                req.originalUrl,
                productData.product_name,
                newProduct.productId,
                productData.product_barcode
            );
        } else {
            // update product info and price
            await productStore.updateProduct(
                product.barcode,
                {
                    name: productData.product_name,
                    categoryId: productData.product_group,
                    weight: productData.product_weight,
                    buyPrice: productData.product_buyprice,
                    sellPrice: productData.product_sellprice,
                    stock: product.stock
                },
                user.userId
            );

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
            await boxStore.insertBox({
                boxBarcode: barcode,
                productBarcode: productData.product_barcode,
                itemsPerBox: items_per_box
            });
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
            await boxStore.updateBox(barcode, {
                productBarcode: productData.product_barcode,
                itemsPerBox: items_per_box
            });

            logger.info('%s %s: updated box %s', req.method, req.originalUrl, barcode);
        }

        res.status(boxCreated ? 201 : 200).json({
            box_barcode: barcode,
            items_per_box: items_per_box,
            product: {
                product_id: product.productId,
                product_name: product.name,
                product_group: product.category.categoryId,
                product_barcode: product.barcode,
                product_weight: product.weight,
                product_sellprice: product.sellPrice,
                product_buyprice: product.buyPrice
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
