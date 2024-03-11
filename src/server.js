'use strict';
import 'dotenv/config.js';
import app from './app.js';
import logger from './logger.js';

const PORT = process.env.PORT;
app.listen(PORT, () => {
    logger.info('rv-backend started at port ' + PORT);
});
