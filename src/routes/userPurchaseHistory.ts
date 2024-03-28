import express from 'express';
import historyStore from '../db/historyStore.js';
import logger from '../logger.js';
import authMiddleware, { type Authenticated_request } from './authMiddleware.js';

const router = express.Router();

router.use(authMiddleware());

router.get('/', async (req: Authenticated_request, res) => {
	const user = req.user;
	try {
		const purchases = await historyStore.getUserPurchaseHistory(user.userId);
		const mappedPurchases = purchases.map((purchase) => {
			return {
				purchaseId: purchase.purchaseId,
				time: purchase.time,
				product: {
					barcode: purchase.product.barcode,
					name: purchase.product.name,
					category: {
						categoryId: purchase.product.category.categoryId,
						description: purchase.product.category.description,
					},
					sellPrice: purchase.product.sellPrice,
					stock: purchase.product.stock,
				},
				price: purchase.price,
				balanceAfter: purchase.balanceAfter,
			};
		});

		logger.info('User %s fetched purchase history', user.username);
		res.status(200).json({
			purchases: mappedPurchases,
		});
	} catch (error) {
		logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
		res.status(500).json({
			error_code: 'internal_error',
			message: 'Internal error',
		});
	}
});

router.get('/:purchaseId(\\d+)', async (req: Authenticated_request, res) => {
	const user = req.user;
	const purchaseId = Number.parseInt(req.params.purchaseId);

	try {
		const purchase = await historyStore.findPurchaseById(purchaseId);

		/* The ID may not be used for any purchase or may be used for a purchase of another user. */
		if (!purchase || purchase.user.userId !== user.userId) {
			logger.error('User %s tried to fetch unknown purchase %s', user.username, purchaseId);
			res.status(404).json({
				error_code: 'not_found',
				message: 'Purchase event does not exist',
			});
			return;
		}

		logger.info('User %s fetched purchase %s', user.username, purchaseId);
		res.status(200).json({
			purchase: {
				purchaseId: purchase.purchaseId,
				time: purchase.time,
				product: {
					barcode: purchase.product.barcode,
					name: purchase.product.name,
					category: {
						categoryId: purchase.product.category.categoryId,
						description: purchase.product.category.description,
					},
					sellPrice: purchase.product.sellPrice,
					stock: purchase.product.stock,
				},
				price: purchase.price,
				balanceAfter: purchase.balanceAfter,
			},
		});
	} catch (error) {
		logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
		res.status(500).json({
			error_code: 'internal_error',
			message: 'Internal error',
		});
	}
});

export default router;
