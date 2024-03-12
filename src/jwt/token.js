import { default as JWT } from 'jsonwebtoken';
import logger from './../logger.js';

const sign = (payload, tokenSecret = process.env.JWT_SECRET) => {
    return JWT.sign(
        { exp: Math.floor(Date.now() / 1000) + 86400, data: payload },
        tokenSecret,
        {
            algorithm: 'HS256',
        },
    );
};

const verify = (jwtToken, tokenSecret = process.env.JWT_SECRET) => {
    let decoded = null;

    try {
        decoded = JWT.verify(jwtToken, tokenSecret, { algorithm: 'HS256' });
    } catch (err) {
        // log error
        logger.error(err);
    }

    return decoded;
};

const jwt = {
    sign,
    verify,
};

export default jwt;
