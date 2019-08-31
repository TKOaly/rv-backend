(() => {
    'use strict';

    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());

    const auth_route = require('./routes/auth');
    const user_route = require('./routes/user');
    const user_purchase_history_route = require('./routes/userPurchaseHistory');
    const user_deposit_history_route = require('./routes/userDepositHistory');
    const register_route = require('./routes/register');
    const admin_auth = require('./routes/admin/adminAuth');
    const admin_products = require('./routes/admin/products');
    const user_products = require('./routes/products');
    const user_categories = require('./routes/categories');
    const admin_global_margin = require('./routes/admin/margin');
    const admin_boxes = require('./routes/admin/boxes');
    const api_reset_route = require('./routes/test_env/api_data_reset');

    app.use('/api/v1/authenticate', auth_route);
    app.use('/api/v1/user/purchaseHistory', user_purchase_history_route);
    app.use('/api/v1/user/depositHistory', user_deposit_history_route);
    app.use('/api/v1/user', user_route);
    app.use('/api/v1/register', register_route);
    app.use('/api/v1/products', user_products);
    app.use('/api/v1/categories', user_categories);

    app.use('/api/v1/admin/authenticate', admin_auth);
    app.use('/api/v1/admin/products', admin_products);
    app.use('/api/v1/admin/margin', admin_global_margin);
    app.use('/api/v1/admin/boxes', admin_boxes);
    app.use('/api/v1/test/reset_data', api_reset_route);

    module.exports = app;
})();
