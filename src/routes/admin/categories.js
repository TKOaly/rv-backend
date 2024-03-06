const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const categoryStore = require('../../db/categoryStore');
const logger = require('../../logger');
const {
    DEFAULT_PRODUCT_CATEGORY,
    getPreference,
} = require('../../db/preferences');

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    const user = req.user;

    try {
        const categories = await categoryStore.getCategories();
        const mappedCategories = categories.map((category) => {
            return {
                categoryId: category.categoryId,
                description: category.description,
            };
        });

        logger.info('User %s fetched categories as admin', user.username);
        res.status(200).json({
            categories: mappedCategories,
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error',
        });
    }
});

router.post('/', async (req, res) => {
    const user = req.user;
    const description = req.body.description;

    const newCategory = await categoryStore.insertCategory(description);

    logger.info(
        'User %s created new category with data {categoryId: %s, description: %s}',
        user.username,
        newCategory.categoryId,
        newCategory.description,
    );
    res.status(201).json({
        category: {
            categoryId: newCategory.categoryId,
            description: newCategory.description,
        },
    });
});

router.get('/:categoryId(\\d+)', async (req, res) => {
    const user = req.user;
    const categoryId = parseInt(req.params.categoryId);

    const category = await categoryStore.findById(categoryId);

    if (!category) {
        logger.error(
            'User %s tried to fetch unknown category %s as admin',
            user.username,
            categoryId,
        );
        res.status(404).json({
            error_code: 'not_found',
            message: 'Category does not exist',
        });
        return;
    }

    logger.info(
        'User %s fetched category %s as admin',
        user.username,
        categoryId,
    );
    res.status(200).json({
        category: {
            categoryId: category.categoryId,
            description: category.description,
        },
    });
});

router.patch('/:categoryId(\\d+)', async (req, res) => {
    const user = req.user;
    const categoryId = parseInt(req.params.categoryId);
    const description = req.body.description;

    /* Checking if category exists. */
    const existingCategory = await categoryStore.findById(categoryId);
    if (!existingCategory) {
        logger.error(
            'User %s tried to modify data of unknown category %s',
            user.username,
            categoryId,
        );
        res.status(404).json({
            error_code: 'not_found',
            message: 'Category does not exist.',
        });
        return;
    }

    const updatedCategory = await categoryStore.updateCategory(
        categoryId,
        description,
    );

    logger.info(
        'User %s modified category data of category %s to {description: %s}',
        user.username,
        updatedCategory.categoryId,
        updatedCategory.description,
    );
    res.status(200).json({
        category: {
            categoryId: updatedCategory.categoryId,
            description: updatedCategory.description,
        },
    });
});

router.delete('/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;

    const defaultCategoryId = await getPreference(DEFAULT_PRODUCT_CATEGORY);
    const defaultCategory = await categoryStore.findById(defaultCategoryId);

    if (categoryId == defaultCategory.categoryId) {
        res.status(403).json({
            error_code: 'bad_request',
            message: 'Cannot delete the default category',
        });

        logger.info(
            "User %s tried to delete the default category '%s' (%d)",
            req.user.username,
            defaultCategory.description,
            defaultCategory.categoryId,
        );

        return;
    }

    const result = await categoryStore.deleteCategory(
        req.params.categoryId,
        defaultCategory.categoryId,
    );

    if (result === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `Category with id '${req.params.categoryId}' not found`,
        });

        logger.info(
            'User %s tried to delete non-exiting category with ID %d',
            req.user.username,
            req.params.categoryId,
        );

        return;
    }

    logger.info(
        "User %s deleted category '%s' (%d), moving %d products to the default category '%s' (%d)",
        req.user.username,
        result.description,
        result.categoryId,
        result.movedProducts.length,
        defaultCategory.description,
        defaultCategory.categoryId,
    );

    res.status(200).json({
        deletedCategory: {
            categoryId: result.categoryId,
            description: result.description,
        },
        movedProducts: result.movedProducts,
    });
});

module.exports = router;
