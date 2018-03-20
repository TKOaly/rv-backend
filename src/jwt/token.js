const jwt = require('jsonwebtoken');
const expiration = Math.floor(Date.now() / 1000) + 86400;

module.exports.sign = function (payload, tokenSecret = process.env.JWT_SECRET) {
    return jwt.sign({ exp: expiration, data: payload }, tokenSecret, { algorithm: 'HS256' });
};

module.exports.verify = function (jwtToken, tokenSecret = process.env.JWT_SECRET) {
    var decoded = null;

    try {
        decoded = jwt.verify(jwtToken, tokenSecret, { algorithm: 'HS256' });
    } catch(err) {
    // log error
    }

    return decoded;
};