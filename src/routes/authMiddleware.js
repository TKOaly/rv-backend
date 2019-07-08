const jwt = require('../jwt/token');
const userStore = require('../db/userStore');
const verifyRoles = require('./authUtils').verifyRoles;
const logger = require('./../logger');

const authMiddleware = (roles = [], tokenSecret = process.env.JWT_SECRET) => {
    return async (req, res, next) => {
        const authHeader = req.get('Authorization');
        let userId = null;

        // verify that Authorization header contains a token
        if (authHeader !== undefined) {
            const parts = authHeader.split(' ');
            if (parts.length == 2 && parts[0] == 'Bearer') {
                const token = jwt.verify(parts[1], tokenSecret);

                if (token) {
                    userId = token.data.userId;
                }
            }
        }

        if (userId !== null) {
            try {
                req.rvuser = await userStore.findById(userId);
                req.rvroles = await userStore.findUserRoles(req.rvuser.name);

                if (req.rvuser && req.rvroles) {
                    // finally, verify that user is authorized
                    if (verifyRoles(roles, req.rvroles)) {
                        logger.info('User ' + req.rvuser.name + ' successfully verified');
                        next();
                    } else {
                        logger.error('User ' + req.rvuser.name + ' is not authorized');
                        res.status(403).json({
                            error_code: 'not_authorized',
                            message: 'Not authorized'
                        });
                    }
                } else {
                    // token contains nonexistent user or no roles
                    logger.error('Invalid authorization token (token contains nonexistent user or no roles)');
                    res.status(401).json({
                        error_code: 'invalid_token',
                        message: 'Invalid authorization token'
                    });
                }
            } catch (error) {
                logger.error('authMiddleware: %s', error);
                res.status(500).json({
                    error_code: 'internal_error',
                    message: 'Internal error'
                });
            }
        } else {
            logger.error('Invalid authorization token (no username in token)');
            // no username in token
            res.status(401).json({
                error_code: 'invalid_token',
                message: 'Invalid authorization token'
            });
        }
    };
};

module.exports = authMiddleware;
