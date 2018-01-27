(function () {
  const jwt = require('../jwt/token');

  function authMiddleware (req, res, next) {
    var authHeader = req.get('Authorization');
    var rvusername = null;
    var rvroles = null;

    if (authHeader !== undefined) {
      var parts = authHeader.split(" ");
      if (parts.length == 2 && parts[0] == 'Bearer') {
        var token = jwt.verify(parts[1]);

        if (token) {
          rvusername = token.data.username;
          rvroles = token.data.roles;
        }
      }
    }

    if (rvusername && rvroles) {
      req.rvusername = rvusername;
      req.rvroles = rvroles;
      next();
    } else {
      res.status(403).json({
        error_code: 'invalid_token',
        message: 'Invalid authorization token'
      });
    }
  }

  module.exports = authMiddleware;
}());