const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const categoryStore = require('../../db/categoryStore');
const logger = require('../../logger');
const fieldValidator = require('../../utils/fieldValidator');
const validators = require('../../utils/validators');

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    const user = req.user;

    try {
        const categories = await categoryStore.getCategories();
        const mappedCategories = categories.map((category) => {
            return {
                categoryId: category.categoryId,
                description: category.description
            };
        });

        logger.info('User %s fetched categories as admin', user.username);
        res.status(200).json({
            categories: mappedCategories
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/', async (req, res) => {
    const user = req.user;

    const inputValidators = [validators.nonEmptyString('description')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const description = req.body.description;

    try {
        const newCategory = await categoryStore.insertCategory(description);

        logger.info(
            'User %s created new category with data {categoryId: %s, description: %s}',
            user.username,
            newCategory.categoryId,
            newCategory.description
        );
        res.status(201).json({
            category: {
                categoryId: newCategory.categoryId,
                description: newCategory.description
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:categoryId(\\d+)', async (req, res) => {
    const user = req.user;
    const categoryId = req.params.categoryId;

    try {
        const category = await categoryStore.findById(categoryId);

        if (!category) {
            logger.error('User %s tried to fetch unknown category %s as admin', user.username, categoryId);
            res.status(404).json({
                error_code: 'category_not_found',
                message: 'Category does not exist'
            });
            return;
        }

        logger.info('User %s fetched category %s as admin', user.username, categoryId);
        res.status(200).json({
            category: {
                categoryId: category.categoryId,
                description: category.description
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.patch('/:categoryId(\\d+)', async (req, res) => {
    const user = req.user;

    const inputValidators = [validators.nonEmptyString('description')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            user.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const categoryId = req.params.categoryId;
    const description = req.body.description;

    try {
        /* Checking if category exists. */
        const existingCategory = await categoryStore.findById(categoryId);
        if (!existingCategory) {
            logger.error('User %s tried to modify data of unknown category %s', user.username, categoryId);
            res.status(404).json({
                error_code: 'not_found',
                message: 'Category does not exist.'
            });
            return;
        }

        const updatedCategory = await categoryStore.updateCategory(categoryId, description);

        logger.info(
            'User %s modified category data of category %s to {description: %s}',
            user.username,
            updatedCategory.categoryId,
            updatedCategory.description
        );
        res.status(200).json({
            category: {
                categoryId: updatedCategory.categoryId,
                description: updatedCategory.description
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
