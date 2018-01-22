(function() {
  'use strict';
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cors());

  var auth_routes = require('./routes/auth');

  app.use('/api/v1/auth', auth_routes);

  module.exports = app;
}());