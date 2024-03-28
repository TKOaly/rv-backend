import express from 'express';
import categoryStore from '../db/categoryStore.js';
import logger from '../logger.js';
import authMiddleware, { type Authenticated_request } from './authMiddleware.js';

const router = express.Router();

router.use(authMiddleware());

router.get('/', async (req: Authenticated_request, res) => {
	const user = req.user;

	try {
		const categories = await categoryStore.getCategories();
		const mappedCategories = categories.map((category) => {
			return {
				categoryId: category.categoryId,
				description: category.description,
			};
		});

		logger.info('User %s fetched categories', user.username);
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

router.get('/:categoryId(\\d+)', async (req: Authenticated_request, res) => {
	const user = req.user;
	const categoryId = Number.parseInt(req.params.categoryId);

	try {
		const category = await categoryStore.findById(categoryId);

		if (!category) {
			logger.error('User %s tried to fetch unknown category %s', user.username, categoryId);
			res.status(404).json({
				error_code: 'not_found',
				message: 'Category does not exist',
			});
			return;
		}

		logger.info('User %s fetched category %s', user.username, categoryId);
		res.status(200).json({
			category: {
				categoryId: category.categoryId,
				description: category.description,
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
