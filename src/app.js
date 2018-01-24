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

  app.use('/api/v1/user/authenticate', auth_route);

  module.exports = app;
}());