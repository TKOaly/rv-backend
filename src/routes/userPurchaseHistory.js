const express = require('express');
const router = express.Router();
const historyStore = require('../db/historyStore');
const authMiddleware = require('./authMiddleware');
const logger = require('../logger');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.user;

    try {
        const purchases = await historyStore.getUserPurchaseHistory(user.userId);
        const mappedPurchases = purchases.map((purchase) => {
            return {
                purchaseId: purchase.itemhistid,
                time: new Date(purchase.time).toISOString(),
                product: {
                    barcode: purchase.barcode,
                    productId: purchase.itemid,
                    name: purchase.descr,
                    category: {
                        categoryId: purchase.pgrpid,
                        description: purchase.pgrpdescr
                    },
                    weight: purchase.weight
                },
                price: purchase.sellprice,
                balanceAfter: purchase.saldo
            };
        });

        logger.info('User %s fetched purchase history', user.username);
        res.status(200).json({
            purchases: mappedPurchases
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:purchaseId(\\d+)', async (req, res) => {
    const user = req.user;
    const purchaseId = req.params.purchaseId;

    try {
        const purchase = await historyStore.findUserPurchaseById(user.userId, purchaseId);

        if (!purchase) {
            logger.error('User %s tried to fetch unknown purchase %s', user.username, purchaseId);
            res.status(404).json({
                error_code: 'purchase_not_found',
                message: 'Purchase event does not exist'
            });
            return;
        }

        logger.info('User %s fetched purchase %s', user.username, purchaseId);
        res.status(200).json({
            purchase: {
                purchaseId: purchase.itemhistid,
                time: new Date(purchase.time).toISOString(),
                product: {
                    barcode: purchase.barcode,
                    productId: purchase.itemid,
                    name: purchase.descr,
                    category: {
                        categoryId: purchase.pgrpid,
                        description: purchase.pgrpdescr
                    },
                    weight: purchase.weight
                },
                price: purchase.sellprice,
                balanceAfter: purchase.saldo
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
