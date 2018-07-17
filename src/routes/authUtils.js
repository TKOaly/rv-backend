const token = require('../jwt/token');
const userStore = require('../db/userStore');
const logger = require('./../logger');

const verifyRoles = (requiredRoles, userRoles) => {
    let verified = true;

    requiredRoles.forEach((role) => {
        if (!userRoles.includes(role)) {
            verified = false;
        }
    });

    return verified;
};

module.exports.verifyRoles = verifyRoles;

module.exports.authenticateUser = async (req, res, requiredRoles = [], tokenSecret = process.env.JWT_SECRET) => {
    if (typeof req.body.username === 'string' && typeof req.body.password === 'string') {
        const username = req.body.username;
        const password = req.body.password;

        try {
            const user = await userStore.findByUsername(username);
            if (user) {
                if (await userStore.verifyPassword(password, user.pass)) {
                    const roles = await userStore.findUserRoles(user.name);

                    if (verifyRoles(requiredRoles, roles)) {
                        logger.info('Generated and signed new JWT for user ' + user.name);
                        res.status(200).json({
                            access_token: token.sign({ username: user.name }, tokenSecret)
                        });
                    } else {
                        logger.error('User ' + user.name + ' is not authorized to view this resource.');
                        res.status(403).json({
                            error_code: 'not_authorized',
                            message: 'Not authorized'
                        });
                    }
                } else {
                    logger.error('Invalid username or password. Username that was entered: ' + username);
                    res.status(403).json({
                        error_code: 'invalid_credentials',
                        message: 'Invalid username or password'
                    });
                }
            } else {
                res.status(403).json({
                    error_code: 'invalid_credentials',
                    message: 'Invalid username or password'
                });
            }
        } catch (error) {
            logger.error('Error: ' + error);
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        }
    } else {
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Bad request'
        });
    }
};
