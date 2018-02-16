(function () {
    const jwt = require('../jwt/token');
    const userStore = require('../db/userStore');

    async function authMiddleware (req, res, next) {
        var authHeader = req.get('Authorization');
        var rvusername = null;

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
                    next();
                } else {
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
            res.status(403).json({
                error_code: 'invalid_token',
                message: 'Invalid authorization token'
            });
        }
    }

    module.exports = authMiddleware;
}());