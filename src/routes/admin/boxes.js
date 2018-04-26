const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const boxStore = require('../../db/boxStore');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');

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
            logger.error(
                '%s: box with barcode %s was not found',
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
                '%s: invalid request',
                req.baseUrl + req.path,
                req.params.barcode);

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

module.exports = router;
