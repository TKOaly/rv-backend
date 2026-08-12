import express from 'express';
import * as productStore from '../db/productStore.js';
import logger from '../logger.js';
import authMiddleware, { type Authenticated_request } from './authMiddleware.js';

const router = express.Router();

router.use(authMiddleware());

router.get('/', async (req: Authenticated_request, res) => {
	const user = req.user;

	const products = await productStore.getProducts();
	const mappedProds = products.map((product) => {
		return {
			barcode: product.barcode,
			name: product.name,
			category: {
				categoryId: product.category.categoryId,
				description: product.category.description,
			},
			sellPrice: product.sellPrice,
			stock: product.stock,
		};
	});

	logger.info('User %s fetched products', user.username);

	res.status(200).json({
		products: mappedProds,
	});
});

router.get('/:barcode(\\d{1,14})', async (req: Authenticated_request, res) => {
	const user = req.user;
	const barcode = req.params.barcode;

	const product = await productStore.findByBarcode(barcode);

	if (!product) {
		logger.warn('User %s tried to fetch unknown product %s', user.username, barcode);

		res.status(404).json({
			error_code: 'not_found',
			message: 'Product does not exist',
		});

		return;
	}

	logger.info('User %s fetched product %s', user.username, barcode);

	res.status(200).json({
		product: {
			barcode: product.barcode,
			name: product.name,
			category: {
				categoryId: product.category.categoryId,
				description: product.category.description,
			},
			sellPrice: product.sellPrice,
			stock: product.stock,
		},
	});
});

router.post('/search', async (req: Authenticated_request, res) => {
	const user = req.user;
	const query = req.body.query;
	const result = await productStore.searchProducts(query);
	logger.info('User %s searched for products with query: %s', user.username, query);
	res.status(200).json({ products: result });
});

router.post(
	'/:barcode(\\d{1,14})/purchase',
	authMiddleware({ rvTerminalRequired: true }),
	async (req: Authenticated_request, res) => {
		const user = req.user;
		const barcode = req.params.barcode;
		const count = req.body.count;

		const product = await productStore.findByBarcode(barcode);

		// product and price found
		if (product) {
			if (product.sellPrice <= 0 || user.moneyBalance > product.sellPrice * count) {
				// record purchase
				const purchases = await productStore.recordPurchase(barcode, user.userId, count);

				const newBalance = purchases[purchases.length - 1].balanceAfter;
				const newStock = purchases[purchases.length - 1].stockAfter;

				const mappedPurchases = purchases.map((purchase) => {
					return {
						purchaseId: purchase.purchaseId,
						time: purchase.time,
						price: purchase.price,
						balanceAfter: purchase.balanceAfter,
						stockAfter: purchase.stockAfter,
					};
				});

				// all done, respond with success
				logger.info('User %s purchased %s x product %s', user.username, count, barcode);
				res.status(200).json({
					accountBalance: newBalance,
					productStock: newStock,
					purchases: mappedPurchases,
				});
			} else {
				// user doesn't have enough money
				logger.warn(
					"User %s tried to purchase %s x product %s but didn't have enough money.",
					user.username,
					count,
					barcode
				);
				res.status(403).json({
					error_code: 'insufficient_funds',
					message: 'Insufficient funds',
				});
			}
		} else {
			// unknown product, no valid price or out of stock
			logger.warn('User %s tried to purchase unknown product %s', user.username, barcode);
			res.status(404).json({
				error_code: 'not_found',
				message: 'Product not found',
			});
		}
	}
);

router.post(
	'/:barcode(\\d{1,14})/return',
	authMiddleware({ rvTerminalRequired: true }),
	async (req: Authenticated_request, res) => {
		const user = req.user;
		const barcode = req.params.barcode;

		const result = await productStore.returnPurchase(barcode, user.userId);

		if (result.success) {
			logger.info('User %s returned product %s successfully', user.username, barcode);
			res.sendStatus(200);
		} else {
			logger.info('User %s attempted to return a product %s unsuccessfully', user.username, barcode);
			res.status(403).json({ message: 'No recent non-returned purchases found for the barcode' });
		}
	}
);

export default router;
