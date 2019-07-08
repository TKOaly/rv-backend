const express = require('express');
const router = express.Router();
const categoryStore = require('../db/categoryStore');
const authMiddleware = require('./authMiddleware');
const logger = require('./../logger');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    try {
        const categories = await categoryStore.findAllCategories();
        const mappedCategories = categories.map((category) => {
            return {
                categoryId: category.pgrpid,
                description: category.descr
            };
        });
        res.status(200).json({
            categories: mappedCategories
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:categoryId(\\d+)', async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        const category = await categoryStore.findById(categoryId);

        if (!category) {
            res.status(404).json({
                error_code: 'category_not_found',
                message: 'Category does not exist'
            });
            return;
        }

        res.status(200).json({
            category: {
                categoryId: category.pgrpid,
                description: category.descr
            }
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
