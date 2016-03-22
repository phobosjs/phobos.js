'use strict';

/*
  bearer.js

  If a bearer token is provided as part of the request, Phobos needs to decode
  and verify it.
*/

const BearerLib = require('../lib/bearer');

module.exports = function bearer(req, res, next) {
  let token = null;

  if (req.query && req.query.auth_token) token = req.query.auth_token;
  if (req.body && req.body.auth_token) token = req.body.auth_token;
  if (req.headers && req.headers.authorization) token = req.headers.authorization.split(' ')[1];

  if (!token) {
    if (req.controller.scopes.indexOf('*') > -1) return next();

    return next({
      stack: 'JsonWebTokenError',
      translation: 'api.error.auth.no_token_present',
      message: 'No token present',
      code: 401
    });
  }

  try {
    const Bearer = new BearerLib(req.phobos.options.bearerTokenSignature);
    const decoded = Bearer.verify(token);

    req.bearerToken = decoded;
    return next();
  } catch (err) {
    return next(err);
  }
};
