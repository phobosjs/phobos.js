'use strict';

var BearerLib = require('../lib/bearer');

module.exports = function(req, res, next) {
  var token = req.query.auth_token || req.body.auth_token;
  token = (req.headers.authorization) ? req.headers.authorization.split(' ')[1] : token;

  if (!token) {
    if (req.controller.action.scope.indexOf('*') > -1) return next();
    return next({ stack: 'JWT', translation: 'api.error.auth.no_token_present', message: 'No token present' });
  }

  try {
    console.log(req.phobos);
    var Bearer = new BearerLib(req.app.locals.phobos.bearerTokenSignature);
    console.log(Bearer);
    var decoded = Bearer.verify(token);

    console.log(decoded);

    req.bearerToken = decoded;
    return next();
  } catch(err) {
    return next(err);
  }
}
