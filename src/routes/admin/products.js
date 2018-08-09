const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const productStore = require('../../db/productStore');
const categoryStore = require('../../db/categoryStore');
const logger = require('./../../logger');
const fieldValidator = require('../../utils/fieldValidator');
const validators = require('../../utils/validators');

const prodFilter = (product) => {
    delete product.userid;
    delete product.starttime;
    delete product.endtime;
    return product;
};

router.use(authMiddleware(['ADMIN'], process.env.JWT_ADMIN_SECRET));

router.get('/product/:productId(\\d+)', async (req, res) => {
    try {
        const product = await productStore.findById(req.params.productId);
        if (!product) {
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
            return;
        }

        res.status(200).json({
            product: prodFilter(product)
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

// Edit product
router.put('/product/:productId(\\d+)', async (req, res) => {
    const body = req.body;

    const inputValidators = [
        validators.nonEmptyString('descr'),
        validators.integer('pgrpid'),
        validators.nonNegativeInteger('weight'),
        validators.nonNegativeInteger('quantity'),
        validators.nonNegativeInteger('buyprice'),
        validators.nonNegativeInteger('sellprice')
    ];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const user = req.rvuser;
    const productId = req.params.productId;
    const descr = body.descr;
    const pgrpid = body.pgrpid;
    const weight = body.weight;
    const quantity = body.quantity;
    const buyprice = body.buyprice;
    const sellprice = body.sellprice;

    try {
        const product = await productStore.findById(productId);
        // Check that product exists
        if (!product) {
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
            return;
        }

        // Validate pgrpid
        const productGroup = await categoryStore.findById(pgrpid);
        if (!productGroup) {
            res.status(400).json({
                error_code: 'bad_request',
                message: 'Product group does not exist'
            });
            return;
        }

        // Basic product info
        await productStore.updateProduct({
            id: productId,
            name: descr,
            group: pgrpid,
            weight: weight,
            userid: user.userid
        });

        // sellprice, buyprice, quantity
        await productStore.changeProductStock(productId, buyprice, sellprice, quantity, user.userid);

        const newProd = await productStore.findById(productId);
        res.status(200).json({
            product: prodFilter(newProd)
        });
    } catch (error) {
        logger.error('Error at ' + req.baseUrl + req.path + ': ' + error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const products = await productStore.findAll();

        const prods = products.map((product) => {
            return {
                product_id: product.itemid,
                product_name: product.descr,
                product_barcode: product.barcode,
                product_group: product.pgrpid,
                buyprice: product.buyprice,
                sellprice: product.sellprice,
                product_weight: parseInt(product.weight || 0),
                quantity: parseInt(product.quantity || 0)
            };
        });
        res.status(200).json({
            products: prods
        });
    } catch (error) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/', async (req, res) => {
    const body = req.body;

    const inputValidators = [
        validators.numericBarcode('barcode'),
        validators.nonEmptyString('descr'),
        validators.integer('pgrpid'),
        validators.nonNegativeInteger('weight'),
        validators.nonNegativeInteger('count'),
        validators.nonNegativeInteger('buyprice'),
        validators.nonNegativeInteger('sellprice')
    ];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const user = req.rvuser;
    const barcode = body.barcode;
    const descr = body.descr;
    const pgrpid = body.pgrpid;
    const weight = body.weight;
    const count = body.count;
    const buyprice = body.buyprice;
    const sellprice = body.sellprice;

    try {
        const product = await productStore.findByBarcode(barcode);
        if (product) {
            logger.error(
                '%s %s: barcode %s is already assigned to product %s',
                req.method,
                req.originalUrl,
                barcode,
                product.descr
            );
            res.status(403).json({
                error_code: 'barcode_taken',
                message: 'Barcode is already assigned to a product'
            });
            return;
        }

        const newProduct = {
            descr: descr,
            pgrpid: pgrpid,
            weight: weight
        };

        const newPrice = {
            barcode: barcode,
            count: count,
            buyprice: buyprice,
            sellprice: sellprice,
            userid: user.userid,
            starttime: new Date(),
            endtime: null
        };

        const newId = await productStore.addProduct(newProduct, newPrice, user.userid);
        newProduct.itemid = newId;
        newPrice.itemid = newId;

        logger.info(
            '%s %s: user %s created new product "%s" with id %s',
            req.method,
            req.originalUrl,
            user.name,
            newProduct.descr,
            newProduct.itemid
        );

        res.status(201).json({
            product: newProduct,
            price: newPrice
        });
    } catch (error) {
        logger.error('%s %s: %s', req.method, req.originalUrl, error.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:barcode(\\d+)', async (req, res) => {
    const params = req.params;

    const paramValidators = [validators.numericBarcode('barcode')];

    const errors = fieldValidator.validateObject(params, paramValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(404).json({
            error_code: 'product_not_found',
            message: 'Item with invalid gtin code does not exist'
        });
        return;
    }

    const barcode = params.barcode;

    try {
        const product = await productStore.findByBarcode(barcode);

        if (product) {
            res.status(200).json({
                product: product
            });
        } else {
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'item not found on database'
            });
        }
    } catch (exception) {
        logger.error('Error at %s: %s', req.baseUrl + req.path, exception.stack);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/product/:id(\\d+)', async (req, res) => {
    const body = req.body;

    const inputValidators = [
        validators.positiveInteger('quantity'),
        validators.nonNegativeInteger('buyprice'),
        validators.nonNegativeInteger('sellprice')
    ];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            req.rvuser.name,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const user = req.rvuser;
    const id = req.params.id;
    const quantity = body.quantity;
    const buyprice = body.buyprice;
    const sellprice = body.sellprice;

    try {
        // check that product exists
        const product = await productStore.findById(id);
        if (!product) {
            logger.error('User tried to do a buy-in for product that does not exist.');
            res.status(404).json({
                error_code: 'product_not_found',
                message: 'Product not found'
            });
            return;
        }

        // update information
        await productStore.changeProductStock(
            product.itemid,
            buyprice,
            sellprice,
            product.count + quantity,
            user.userid
        );

        // return updated information
        logger.info('Successful buy-in of ' + quantity + ' pcs of Product #' + parseInt(id, 10));
        res.status(200).json({
            product_id: parseInt(id, 10),
            buyprice: buyprice,
            sellprice: sellprice,
            quantity: product.count + quantity
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
