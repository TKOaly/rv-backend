const token = require('../jwt/token');
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

module.exports.verifyRoles = verifyRoles;

module.exports.authenticateUser = async (
    req, 
    res, 
    requiredRoles = [],
    tokenSecret = process.env.JWT_SECRET
) => {
    if (req.body.username && req.body.password) {
        var username = req.body.username;
        var password = req.body.password;

        try {
            var user = await userStore.findByUsername(username);
            if (user) {
                if (await userStore.verifyPassword(password, user.pass)) {
                    var roles = await userStore.findUserRoles(user.name);

                    if (verifyRoles(requiredRoles, roles)) {
                        res.status(200).json({
                            access_token: token.sign({ username: user.name }, tokenSecret)
                        });
                    } else {
                        res.status(403).json({
                            error_code: 'not_authorized',
                            message: 'Not authorized'
                        });
                    }
                } else {
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
        }
        catch (error) {
            res.status(500).json({
                error_code: 'internal_error',
                message: 'Internal error'
            });
        }
    } else {
        res.status(400).json({ error_code: 'bad_request', message: 'Bad request' });
    }
};
