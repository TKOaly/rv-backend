import path from 'path';
import cors from 'cors';
import express from 'express';
import OpenApiValidator from 'express-openapi-validator';
import helmet from 'helmet';
import logger from './logger.js';

import admin_auth from './routes/admin/adminAuth.js';
import admin_boxes from './routes/admin/boxes.js';
import admin_categories from './routes/admin/categories.js';
import admin_default_margin from './routes/admin/default_margin.js';
import admin_history from './routes/admin/history.js';
import admin_preferences from './routes/admin/preferences.js';
import admin_products from './routes/admin/products.js';
import admin_users from './routes/admin/users.js';
import auth_route from './routes/auth.js';
import user_categories from './routes/categories.js';
import user_products from './routes/products.js';
import register_route from './routes/register.js';
import api_reset_route from './routes/test_env/api_data_reset.js';
import user_route from './routes/user.js';
import user_deposit_history_route from './routes/userDepositHistory.js';
import user_purchase_history_route from './routes/userPurchaseHistory.js';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(
	OpenApiValidator.middleware({
		apiSpec: path.resolve(import.meta.dirname, '../openapi.yaml'),
		validateRequests: true,
		validateResponses: process.env.NODE_ENV !== 'production',
		ignorePaths: /^\/api\/[^/]+\/test\/.*/,
	})
);

app.use('/api/v1/authenticate', auth_route);
app.use('/api/v1/user/purchaseHistory', user_purchase_history_route);
app.use('/api/v1/user/depositHistory', user_deposit_history_route);
app.use('/api/v1/user', user_route);
app.use('/api/v1/register', register_route);
app.use('/api/v1/products', user_products);
app.use('/api/v1/categories', user_categories);

app.use('/api/v1/admin/defaultMargin', admin_default_margin);
app.use('/api/v1/admin/authenticate', admin_auth);
app.use('/api/v1/admin/products', admin_products);
app.use('/api/v1/admin/boxes', admin_boxes);
app.use('/api/v1/admin/categories', admin_categories);
app.use('/api/v1/admin/users', admin_users);
app.use('/api/v1/admin', admin_history);
app.use('/api/v1/admin/preferences', admin_preferences);
app.use('/api/v1/test/reset_data', api_reset_route);

app.use((error, _req, res, next) => {
	logger.error(
		'Invalid or missing fields in request: %s',
		error.errors.map(({ path, message }) => `Field ${path.substring(6)} ${message}`)
	);
	if (error.status === 400) {
		res.status(400).json({
			error_code: 'bad_request',
			message: 'Invalid or missing fields in request',
			errors: error.errors.map(({ path, message }) => `Field ${path.substring(6)} ${message}`),
		});

		return;
	}

	res.status(500).json({
		error_code: 'internal_error',
		message: 'Internal server error',
	});
	next(error);
});

export default app;
