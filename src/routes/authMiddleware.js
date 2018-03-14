
const jwt = require('../jwt/token');
const userStore = require('../db/userStore');

const verifyRoles = (requiredRoles, userRoles) => {
    var verified = true;

    requiredRoles.forEach(role => {
        if (!userRoles.includes(role)) {
            verified = false;
        }
    });

    return verified;
};

const authMiddleware = (roles = []) => {
    return async (req, res, next) => {
        var authHeader = req.get('Authorization');
        var rvusername = null;

        // verify that Authorization header contains a token
        if (authHeader !== undefined) {
            var parts = authHeader.split(' ');
            if (parts.length == 2 && parts[0] == 'Bearer') {
                var token = jwt.verify(parts[1]);

                if (token) {
                    rvusername = token.data.username;
                }
            }
        }

        if (rvusername) {
            try {
                req.rvuser = await userStore.findByUsername(rvusername);
                req.rvroles = await userStore.findUserRoles(rvusername);
                
                if (req.rvuser && req.rvroles) {
                    // finally, verify that user is authorized
                    if (verifyRoles(roles, req.rvroles)) {
                        next();
                    } else {
                        res.status(403).json({
                            error_code: 'not_authorized',
                            message: 'Not authorized'
                        });
                    }
                } else {
                    // token contains nonexistent user or no roles
                    res.status(403).json({
                        error_code: 'invalid_token',
                        message: 'Invalid authorization token'
                    });
                }
            }
            catch (error) {
                res.status(500).json({
                    error_code: 'internal_error',
                    message: 'Internal error'
                });
            }
        } else {
            // no username in token
            res.status(403).json({
                error_code: 'invalid_token',
                message: 'Invalid authorization token'
            });
        }
    };
};

module.exports = authMiddleware;