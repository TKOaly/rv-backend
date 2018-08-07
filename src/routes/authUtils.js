const token = require('../jwt/token');
const userStore = require('../db/userStore');
const logger = require('./../logger');
const fieldValidator = require('../utils/fieldValidator');
const validators = require('../utils/validators');

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
    const body = req.body;

    const inputValidators = [
        validators.nonEmptyString('username'),
        /* Empty passwords are allowed at login for legacy reasons. There are existing users in the database with empty
         * passwords. */
        validators.string('password')
    ];

    const errors = fieldValidator.validateObject(body, inputValidators);
    if (errors.length > 0) {
        logger.error('%s %s: invalid request: %s', req.method, req.originalUrl, errors.join(', '));
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const username = body.username;
    const password = body.password;

    try {
        const user = await userStore.findByUsername(username);
        if (user) {
            if (await userStore.verifyPassword(password, user.pass)) {
                const roles = await userStore.findUserRoles(user.name);

                if (verifyRoles(requiredRoles, roles)) {
                    logger.info('Generated and signed new JWT for user ' + user.name);
                    res.status(200).json({
                        accessToken: token.sign({ username: user.name }, tokenSecret)
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
                res.status(401).json({
                    error_code: 'invalid_credentials',
                    message: 'Invalid username or password'
                });
            }
        } else {
            logger.error('Invalid username or password. Username that was entered: ' + username);
            res.status(401).json({
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
};
