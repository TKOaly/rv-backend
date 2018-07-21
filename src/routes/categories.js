const express = require('express');
const router = express.Router();
const productStore = require('../db/productStore');
const logger = require('winston');

router.get('/', async (req, res) => {
    try {
        const categories = await productStore.findAllCategories();
        const parsedCategories = categories.map((category) => {
            return {
                category_id: category.pgrpid,
                category_description: category.descr
            };
        });
        res.status(200).json({
            categories: parsedCategories
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
