const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const boxStore = require('../../db/boxStore');
const productStore = require('../../db/productStore');
const logger = require('./../../logger');
const deleteUndefinedFields = require('../../utils/objectUtils').deleteUndefinedFields;

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

const mapDatabaseBoxToApiBox = (box) => ({
    boxBarcode: box.boxBarcode,
    itemsPerBox: box.itemsPerBox,
    product: {
        barcode: box.product.barcode,
        name: box.product.name,
        category: {
            categoryId: box.product.category.categoryId,
            description: box.product.category.description,
        },
        weight: box.product.weight,
        buyPrice: box.product.buyPrice,
        sellPrice: box.product.sellPrice,
        stock: box.product.stock,
    },
});

router.get('/', async (req, res) => {
    const user = req.user;

    try {
        const boxes = await boxStore.getBoxes();
        const mappedBoxes = boxes.map(mapDatabaseBoxToApiBox);

        logger.info('User %s fetched boxes as admin', user.username);
        res.status(200).json({
            boxes: mappedBoxes,
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
    const boxBarcode = req.body.boxBarcode;
    const itemsPerBox = req.body.itemsPerBox;
    const productBarcode = req.body.productBarcode;

    /* Checking if box already exists. */
    const existingBox = await boxStore.findByBoxBarcode(boxBarcode);
    if (existingBox) {
        logger.error('User %s failed to create new box, box barcode %s was already taken', user.username, boxBarcode);
        res.status(409).json({
            error_code: 'identifier_taken',
            message: 'Box barcode already in use.',
        });
        return;
    }

    /* Checking if product exists. */
    const existingProduct = await productStore.findByBarcode(productBarcode);
    if (!existingProduct) {
        logger.error('User %s tried to create box of unknown product %s', user.username, productBarcode);
        res.status(400).json({
            error_code: 'invalid_reference',
            message: 'Referenced product not found.',
        });
        return;
    }

    const newBox = await boxStore.insertBox({
        boxBarcode,
        itemsPerBox,
        productBarcode,
    });

    logger.info(
        'User %s created new box with data {boxBarcode: %s, itemsPerBox: %s, productBarcode: %s}',
        user.username,
        boxBarcode,
        itemsPerBox,
        productBarcode,
    );
    res.status(201).json({
        box: mapDatabaseBoxToApiBox(newBox),
    });
});

router.get('/:boxBarcode(\\d{1,14})', async (req, res) => {
    const user = req.user;
    const boxBarcode = req.params.boxBarcode;

    const box = await boxStore.findByBoxBarcode(boxBarcode);

    if (!box) {
        logger.error('User %s tried to fetch unknown box %s as admin', user.username, boxBarcode);
        res.status(404).json({
            error_code: 'not_found',
            message: 'Box does not exist',
        });
        return;
    }

    logger.info('User %s fetched box %s as admin', user.username, boxBarcode);
    res.status(200).json({
        box: mapDatabaseBoxToApiBox(box),
    });
});

router.patch('/:boxBarcode(\\d{1,14})', async (req, res) => {
    const user = req.user;
    const boxBarcode = req.params.boxBarcode;
    const itemsPerBox = req.body.itemsPerBox;
    const productBarcode = req.body.productBarcode;

    /* Checking if box exists. */
    const existingBox = await boxStore.findByBoxBarcode(boxBarcode);
    if (!existingBox) {
        logger.error('User %s tried to modify data of unknown box %s', user.username, boxBarcode);
        res.status(404).json({
            error_code: 'not_found',
            message: 'Box does not exist.',
        });
        return;
    }

    /* Checking if product exists. */
    if (productBarcode !== undefined) {
        const existingProduct = await productStore.findByBarcode(productBarcode);
        if (!existingProduct) {
            logger.error(
                'User %s tried to modify product of box %s to unknown product %s',
                user.username,
                boxBarcode,
                productBarcode,
            );
            res.status(400).json({
                error_code: 'invalid_reference',
                message: 'Referenced product not found.',
            });
            return;
        }
    }

    const updatedBox = await boxStore.updateBox(
        boxBarcode,
        deleteUndefinedFields({
            itemsPerBox,
            productBarcode,
        }),
    );

    logger.info(
        'User %s modified box data of box %s to {itemsPerBox: %s, productBarcode: %s}',
        user.username,
        boxBarcode,
        updatedBox.itemsPerBox,
        updatedBox.product.barcode,
    );

    res.status(200).json({
        box: mapDatabaseBoxToApiBox(updatedBox),
    });
});

router.delete('/:boxBarcode(\\d{1,14})', async (req, res) => {
    const boxBarcode = req.params.boxBarcode;
    const deletedBox = await boxStore.deleteBox(boxBarcode);

    if (deletedBox) {
        res.status(200).json({
            deletedBox: mapDatabaseBoxToApiBox(deletedBox),
        });

        logger.info(
            'User %s deleted a box (%s) of product (%s, %s)',
            req.user.username,
            boxBarcode,
            deletedBox.product.name,
            deletedBox.product.barcode,
        );
    } else {
        res.status(404).json({
            error_code: 'not_found',
            message: `No box with barcode '${boxBarcode}' found`,
        });

        logger.info("User %s tried to delete a non-existent box with barcode '%s'", req.user.username, boxBarcode);
    }
});

router.post('/:boxBarcode(\\d{1,14})/buyIn', async (req, res) => {
    const boxBarcode = req.params.boxBarcode;
    const { productSellPrice, productBuyPrice } = req.body;

    const box = await boxStore.findByBoxBarcode(boxBarcode);

    if (box === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No box with barcode '${boxBarcode}' found`,
        });

        return;
    }

    const { sellprice: oldsellprice, buyprice: oldbuyprice } = box;

    const stock = await boxStore.buyIn(boxBarcode, req.body.boxCount);

    logger.info(
        "User %s bought in %d boxes (%s) - total of %d items of product '%s' (%s)",
        req.user.username,
        req.body.boxCount,
        boxBarcode,
        box.itemsPerBox * req.body.boxCount,
        box.product.name,
        box.product.barcode,
    );

    const update = {
        sellPrice: oldsellprice !== productSellPrice ? productSellPrice : undefined,
        buyPrice: oldbuyprice !== productBuyPrice ? productBuyPrice : undefined,
    };

    await productStore.updateProduct(box.product.barcode, update, req.user.userId);

    if (update.sellPrice !== undefined || update.buyPrice !== undefined) {
        const changes = [];

        if (update.sellPrice !== undefined) {
            changes.push(`sellPrice from ${box.product.sellPrice} to ${update.sellPrice}`);
        }

        if (update.sellPrice !== undefined) {
            changes.push(`buyPrice from ${box.product.buyPrice} to ${update.buyPrice}`);
        }

        logger.info(
            "User %s changed %s on product '%s' (%s)",
            req.user.username,
            changes.join(' and '),
            box.product.name,
            box.product.barcode,
        );
    }

    res.status(200).json({
        productStock: stock,
        productBuyPrice: req.body.productBuyPrice,
        productSellPrice: req.body.productSellPrice,
    });
});

module.exports = router;
