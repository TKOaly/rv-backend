'use strict';
require('dotenv').config();
const logger = require('./logger');

const PORT = process.env.PORT;
const app = require('./app');
app.listen(
	PORT,
	() => {
		logger.info('rv-backend started at port ' + PORT);
	},
);
