(function() {
    'use strict';

    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    const app = express();

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cors());

    const auth_route = require('./routes/auth');
    const account_route = require('./routes/account');
    const register_route = require('./routes/register');
    const admin_auth = require('./routes/admin/adminAuth');
    const admin_products = require('./routes/admin/products');
    const user_products = require('./routes/products');
    const user_categories = require('./routes/categories');
    const admin_global_margin = require('./routes/admin/margin');
    const admin_boxes = require('./routes/admin/boxes');

    app.use('/api/v1/authenticate', auth_route);
    app.use('/api/v1/user/account', account_route);
    app.use('/api/v1/register', register_route);
    app.use('/api/v1/products', user_products);
    app.use('/api/v1/categories', user_categories);

    app.use('/api/v1/admin/authenticate', admin_auth);
    app.use('/api/v1/admin/products', admin_products);
    app.use('/api/v1/admin/margin', admin_global_margin);
    app.use('/api/v1/admin/boxes', admin_boxes);

    module.exports = app;
})();
