const express = require('express');
const router = express.Router();
const productStore = require('../db/productStore');
const logger = require('winston');

router.get('/', async (req, res) => {
    try {
        var categories = await productStore.findAllCategories();
        const parsedCategories = categories.map(category => {
            return {
                category_id: category.pgrpid,
                category_description: category.descr
            };
        });
        return res.status(200).json({
            categories: parsedCategories
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
    }
});

module.exports = router;
