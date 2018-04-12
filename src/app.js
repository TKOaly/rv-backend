(function() {
    'use strict';
    
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    const app = express();

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cors());

    var auth_route = require('./routes/auth');
    var account_route = require('./routes/account');
    var register_route = require('./routes/register');
    var purchase_route = require('./routes/purchase');
    var admin_auth = require('./routes/admin/adminAuth');
    var admin_products = require('./routes/admin/products');
    var user_products = require('./routes/products');
    var admin_global_margin = require('./routes/admin/margin');

    app.use('/api/v1/user/authenticate', auth_route);
    app.use('/api/v1/user/account', account_route);
    app.use('/api/v1/user/register', register_route);
    app.use('/api/v1/user/products', user_products);
    app.use('/api/v1/product/purchase', purchase_route);

    app.use('/api/v1/admin/authenticate', admin_auth);
    app.use('/api/v1/admin/products', admin_products);
    app.use('/api/v1/admin/margin', admin_global_margin);

    module.exports = app;
})();
