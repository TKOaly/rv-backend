const jwt = require('jsonwebtoken');
const logger = require('./../logger');
const expiration = Math.floor(Date.now() / 1000) + 86400;

module.exports.sign = (payload, tokenSecret = process.env.JWT_SECRET) => {
    return jwt.sign({ exp: expiration, data: payload }, tokenSecret, {
        algorithm: 'HS256'
    });
};

module.exports.verify = (jwtToken, tokenSecret = process.env.JWT_SECRET) => {
    let decoded = null;

    try {
        decoded = jwt.verify(jwtToken, tokenSecret, { algorithm: 'HS256' });
    } catch (err) {
        // log error
        logger.error(err);
    }

    return decoded;
};
