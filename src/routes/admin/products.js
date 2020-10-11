const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const productStore = require('../../db/productStore');
const categoryStore = require('../../db/categoryStore');
const logger = require('./../../logger');
const fieldValidator = require('../../utils/fieldValidator');
const validators = require('../../utils/validators');
const deleteUndefinedFields = require('../../utils/objectUtils').deleteUndefinedFields;
const purchaseHistory = require('./purchase_history');

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    const user = req.user;

    try {
        const products = await productStore.getProducts();
        const mappedProds = products.map((product) => {
            return {
                barcode: product.barcode,
                name: product.name,
                category: {
                    categoryId: product.category.categoryId,
                    description: product.category.description
                },
                weight: product.weight,
                buyPrice: product.buyPrice,
                sellPrice: product.sellPrice,
                stock: product.stock
            };
        });

        logger.info('User %s fetched products as admin', user.username);
        res.status(200).json({
            products: mappedProds
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

    const inputValidators = [
        validators.numericBarcode('barcode'),
        validators.nonEmptyString('name'),
        validators.nonNegativeInteger('categoryId'),
        validators.nonNegativeInteger('weight'),
        validators.integer('buyPrice'),
        validators.integer('sellPrice'),
        validators.integer('stock')
    ];

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

    const { barcode, name, categoryId, weight, buyPrice, sellPrice, stock } = req.body;

    try {
        /* Checking if product already exists. */
        const existingProduct = await productStore.findByBarcode(barcode);
        if (existingProduct) {
            logger.error('User %s failed to create new product, barcode %s was already taken', user.username, barcode);
            res.status(409).json({
                error_code: 'identifier_taken',
                message: 'Barcode already in use.'
            });
            return;
        }

        /* Checking if category exists. */
        const existingCategory = await categoryStore.findById(categoryId);
        if (!existingCategory) {
            logger.error('User %s tried to create product of unknown category %s', user.username, categoryId);
            res.status(400).json({
                error_code: 'invalid_reference',
                message: 'Referenced category not found.'
            });
            return;
        }

        const newProduct = await productStore.insertProduct(
            {
                barcode,
                name,
                categoryId,
                weight,
                buyPrice,
                sellPrice,
                stock
            },
            user.userId
        );

        logger.info(
            'User %s created new product with data {barcode: %s, name: %s, categoryId: %s, weight: %s, buyPrice: %s, sellPrice: %s, stock: %s}',
            user.username,
            barcode,
            name,
            categoryId,
            weight,
            buyPrice,
            sellPrice,
            stock
        );
        res.status(201).json({
            product: {
                barcode: newProduct.barcode,
                name: newProduct.name,
                category: {
                    categoryId: newProduct.category.categoryId,
                    description: newProduct.category.description
                },
                weight: newProduct.weight,
                buyPrice: newProduct.buyPrice,
                sellPrice: newProduct.sellPrice,
                stock: newProduct.stock
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

router.get('/:barcode(\\d{1,14})', async (req, res) => {
    const user = req.user;
    const barcode = req.params.barcode;

    try {
        const product = await productStore.findByBarcode(barcode);

        if (!product) {
            logger.error('User %s tried to fetch unknown product %s as admin', user.username, barcode);
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product does not exist'
            });
            return;
        }

        logger.info('User %s fetched product %s as admin', user.username, barcode);
        res.status(200).json({
            product: {
                barcode: product.barcode,
                name: product.name,
                category: {
                    categoryId: product.category.categoryId,
                    description: product.category.description
                },
                weight: product.weight,
                buyPrice: product.buyPrice,
                sellPrice: product.sellPrice,
                stock: product.stock
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

router.patch('/:barcode(\\d{1,14})', async (req, res) => {
    const user = req.user;

    const inputValidators = [
        validators.nonEmptyString('name'),
        validators.nonNegativeInteger('categoryId'),
        validators.nonNegativeInteger('weight'),
        validators.integer('buyPrice'),
        validators.integer('sellPrice'),
        validators.integer('stock')
    ];

    const errors = fieldValidator.validateOptionalFields(req.body, inputValidators);
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

    const barcode = req.params.barcode;
    const { name, categoryId, weight, buyPrice, sellPrice, stock } = req.body;

    try {
        /* Checking if product exists. */
        const existingProduct = await productStore.findByBarcode(barcode);
        if (!existingProduct) {
            logger.error('User %s tried to modify data of unknown product %s', user.username, barcode);
            res.status(404).json({
                error_code: 'not_found',
                message: 'Product does not exist.'
            });
            return;
        }

        /* Checking if category exists. */
        if (categoryId !== undefined) {
            const existingCategory = await categoryStore.findById(categoryId);
            if (!existingCategory) {
                logger.error(
                    'User %s tried to modify category of product %s to unknown category %s',
                    user.username,
                    barcode,
                    categoryId
                );
                res.status(400).json({
                    error_code: 'invalid_reference',
                    message: 'Referenced category not found.'
                });
                return;
            }
        }

        const updatedProduct = await productStore.updateProduct(
            barcode,
            deleteUndefinedFields({
                name,
                categoryId,
                weight,
                buyPrice,
                sellPrice,
                stock
            }),
            user.userId
        );

        logger.info(
            'User %s modified product data of product %s to {name: %s, categoryId: %s, weight: %s, buyPrice: %s, sellPrice: %s, stock: %s}',
            user.username,
            barcode,
            updatedProduct.name,
            updatedProduct.category.categoryId,
            updatedProduct.weight,
            updatedProduct.buyPrice,
            updatedProduct.sellPrice,
            updatedProduct.stock
        );
        res.status(200).json({
            product: {
                barcode: updatedProduct.barcode,
                name: updatedProduct.name,
                category: {
                    categoryId: updatedProduct.category.categoryId,
                    description: updatedProduct.category.description
                },
                weight: updatedProduct.weight,
                buyPrice: updatedProduct.buyPrice,
                sellPrice: updatedProduct.sellPrice,
                stock: updatedProduct.stock
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

router.delete('/:barcode(\\d{1,14})', async (req, res) => {
    const product = await productStore.deleteProduct(req.params.barcode);

    if (product === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No product with barcode '${req.params.barcode}' found`
        });

        return;
    }

    res.status(200).json({
        deletedProduct: product
    });
});

router.post('/:barcode(\\d{1,14})/buyIn', async (req, res) => {
    const barcode = req.params.barcode;

    const inputValidators = [
        validators.positiveInteger('count'),
        validators.nonNegativeInteger('buyPrice'),
        validators.nonNegativeInteger('sellPrice')
    ];

    const errors = fieldValidator.validateObject(req.body, inputValidators);

    if (errors.length > 0) {
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Invalid or missing fields in request body',
            errors
        });

        return;
    }

    const { count, buyPrice, sellPrice } = req.body;

    const product = await productStore.findByBarcode(barcode);

    if (product === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No product with barcode '${ barcode }' found`
        });

        return;
    }

    const stock = await productStore.buyIn(barcode, count);

    const update = {
        sellPrice: product.sellPrice !== sellPrice ? sellPrice : undefined,
        buyPrice: product.buyPrice !== buyPrice ? buyPrice : undefined
    };

    const updatedProduct = await productStore.updateProduct(barcode, update, req.user.userId);

    res.status(200).json({
        stock,
        buyPrice: updatedProduct.buyPrice,
        sellPrice: updatedProduct.sellPrice
    });
});

router.use('/:barcode(\\d{1,14})/purchaseHistory', (req, res) => {
    const barcode = req.params.barcode;
    const filter = (builder) => builder.where('PRICE.barcode', barcode);

    return purchaseHistory(filter)(req, res);
});

module.exports = router;
