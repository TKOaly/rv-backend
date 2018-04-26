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

module.exports = router;
