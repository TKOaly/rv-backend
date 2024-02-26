const token = require('../jwt/token');
const userStore = require('../db/userStore');
const logger = require('./../logger');

/* null means no role requirements. */
const verifyRole = (requiredRole, userRole) => {
    return requiredRole === null || requiredRole === userRole;
};

module.exports.verifyRole = verifyRole;

module.exports.authenticateUserRfid =
    (requiredRole = null, tokenSecret = process.env.JWT_SECRET) => async (req, res) => {
        const body = req.body;
        const rfid = body.rfid;

        const user = await userStore.findByRfid(rfid);
        if (user) {
                if (verifyRole(requiredRole, user.role)) {
                    logger.info('User %s logged in as role %s', user.username, requiredRole);
                    res.status(200).json({
                        accessToken: token.sign({ userId: user.userId }, tokenSecret)
                    });
                } else {
                    logger.error('User %s is not authorized to login as role %s', user.username, requiredRole);
                    res.status(403).json({
                        error_code: 'not_authorized',
                        message: 'Not authorized'
                    });
                }
        } else {
            logger.error('Failed to login with rfid');
            res.status(401).json({
                error_code: 'invalid_credentials',
                message: 'Invalid rfid'
            });
        }
    };
module.exports.authenticateUser =
    (requiredRole = null, tokenSecret = process.env.JWT_SECRET) => async (req, res) => {
        const body = req.body;
        const username = body.username;
        const password = body.password;

        const user = await userStore.findByUsername(username);
        logger.info(username)
        logger.info(password)
        if (user) {
            logger.info(password);
            if (password != undefined && await userStore.verifyPassword(password, user.passwordHash)) {
                if (verifyRole(requiredRole, user.role)) {
                    logger.info('User %s logged in as role %s', user.username, requiredRole);
                    res.status(200).json({
                        accessToken: token.sign({ userId: user.userId }, tokenSecret)
                    });
                } else {
                    logger.error('User %s is not authorized to login as role %s', user.username, requiredRole);
                    res.status(403).json({
                        error_code: 'not_authorized',
                        message: 'Not authorized'
                    });
                }
            } else {
                logger.error('Failed to login with username and password. Username was %s', username);
                res.status(401).json({
                    error_code: 'invalid_credentials',
                    message: 'Invalid username or password'
                });
            }
        } else {
            logger.error('Failed to login with username and password. Username was %s', username);
            res.status(401).json({
                error_code: 'invalid_credentials',
                message: 'Invalid username or password'
            });
        }
    };
