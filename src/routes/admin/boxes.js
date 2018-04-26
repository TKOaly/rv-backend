const isObject = require('util').isObject;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const boxStore = require('../../db/boxStore');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');
const fieldValidator = require('./../../utils/fieldValidator');

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
            logger.error('Box with barcode %s was not found', req.params.barcode);
            return res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
        }

        return res.status(200).json(box);
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
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
                'POST %s: box with barcode %s was not found',
                req.baseUrl + req.path,
                req.params.barcode);
            return res.status(404).json({
                error_code: 'box_not_found',
                message: 'Box not found'
            });
        }

        const sellprice = parseInt(req.body.sellprice, 10);
        const buyprice = parseInt(req.body.buyprice, 10);
        const boxes = parseInt(req.body.boxes, 10);
        let errors = [];
        
        // validate request
        isNaN(sellprice) && errors.push('sellprice should be a number');
        isNaN(buyprice) && errors.push('buyprice should be a number');
        isNaN(boxes) && errors.push('boxes should be a number');
        sellprice < 0 && errors.push('sellprice cannot be negative');
        buyprice < 0 && errors.push('buyprice cannot be negative');
        sellprice < buyprice && errors.push('sellprice cannot be lower than buyprice');
        boxes < 0 && errors.push('boxes should be over 0');

        if (errors.length > 0) {
            logger.error(
                'POST %s: invalid request by user %s: %s',
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
        await productStore.changeProductStock(
            box.product_id,
            buyprice,
            sellprice,
            quantity,
            req.rvuser.userid
        );

        logger.info(
            'user %s added %d boxes (%d pcs) of product %d (box %s, product barcode %s)',
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
        logger.error('%s: %s', req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

const boxValidators = [
    {
        field: 'items_per_box',
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)) && v > 0,
            'items_per_box should be a number greater than 0'
        )
    },
    {
        field: 'product',
        validator: fieldValidator.createValidator(
            v => isObject(v),
            'product should be an object'
        )
    }
];

const productValidators = [
    {
        field: 'product_barcode',
        validator: fieldValidator.createValidator(
            v => typeof v === 'string' && v.match('^\\d+$'),
            'product_barcode should be a string of digits'
        )
    },
    {
        field: 'product_name',
        validator: fieldValidator.createValidator(
            v => typeof v === 'string' && v && v.length > 0,
            'product_name should be a non-empty string'
        )
    },
    {
        field: 'product_group',
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)),
            'product_group should be a number'
        )
    },
    {
        field: 'product_weight',
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)),
            'weight should be a number'
        )
    },
    {
        field: 'product_buyprice',
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)) && v >= 0,
            'product_buyprice should not be negative'
        )
    },
    {
        field: 'product_sellprice',
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)) && v >= 0,
            'product_sellprice should not be negative'
        )
    }
];

router.put('/:barcode(\\d+)', async (req, res) => {
    // validate request
    const boxErrors = fieldValidator.validateObject(req.body, boxValidators);
    if (boxErrors.length > 0) {
        logger.error(
            'PUT %s: invalid request by user %s: %s',
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

    const productErrors = fieldValidator.validateObject(
        req.body.product, 
        productValidators
    );
    if (productErrors.length > 0) {
        logger.error(
            'PUT %s: invalid request by user %s: %s',
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
        let box = await boxStore.findByBoxBarcode(req.params.barcode);
        let product = await productStore.findByBarcode(req.body.product.product_barcode);
        let boxCreated = false;

        
    } catch (error) {
        logger.error('%s: %s', req.baseUrl + req.path, error.stack);
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
