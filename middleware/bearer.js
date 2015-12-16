'use strict';

/*
  bearer.js

  If a bearer token is provided as part of the request, Phobos needs to decode
  and verify it.
*/

var BearerLib = require('../lib/bearer');

module.exports = function bearer(req, res, next) {
  var token = req.query.auth_token || req.body.auth_token;
  token = (req.headers.authorization) ? req.headers.authorization.split(' ')[1] : token;

  if (!token) {
    if (req.controller.scopes.indexOf('*') > -1) return next();

    return next({
      stack: 'JWT',
      translation: 'api.error.auth.no_token_present',
      message: 'No token present',
      code: 401
    });
  }

  try {
    var Bearer = new BearerLib(req.phobos.options.bearerTokenSignature);
    var decoded = Bearer.verify(token);

    req.bearerToken = decoded;
    return next();
  } catch(err) {
    return next(err);
  }
}
