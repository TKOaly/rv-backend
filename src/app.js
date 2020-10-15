(() => {
    'use strict';

    const path = require('path');
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const app = express();
    const OpenApiValidator = require('express-openapi-validator');

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());

    app.use(
        OpenApiValidator.middleware({
            apiSpec: path.resolve(__dirname, '../openapi.yaml'),
            validateRequests: true,
            validateResponses: process.env.NODE_ENV !== 'production',
            ignorePaths: /^\/api\/[^/]+\/test\/.*/
        })
    );

    const auth_route = require('./routes/auth');
    const user_route = require('./routes/user');
    const user_purchase_history_route = require('./routes/userPurchaseHistory');
    const user_deposit_history_route = require('./routes/userDepositHistory');
    const register_route = require('./routes/register');
    const admin_auth = require('./routes/admin/adminAuth');
    const admin_products = require('./routes/admin/products');
    const user_products = require('./routes/products');
    const user_categories = require('./routes/categories');
    const admin_boxes = require('./routes/admin/boxes');
    const admin_categories = require('./routes/admin/categories');
    const admin_users = require('./routes/admin/users');
    const api_reset_route = require('./routes/test_env/api_data_reset');
    const admin_default_margin = require('./routes/admin/default_margin');
    const admin_history = require('./routes/admin/history');
    const admin_preferences = require('./routes/admin/preferences');

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

    app.use((error, req, res, next) => {
        console.log(error);

        if (error.status === 400) {
            res.status(400).json({
                error_code: 'bad_request',
                message: 'Invalid or missing fields in request',
                errors: error.errors.map(({ path, message }) => `Field ${path.substring(6)} ${message}`)
            });

            return;
        }

        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal server error'
        });
    });

    module.exports = app;
})();
