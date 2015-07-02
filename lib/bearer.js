'use strict';

var jwt = require('jsonwebtoken');
var sig = process.env.BEARER_SIGNATURE;

var _generate = function(data) {
  var opts = { expiresInMinutes: 10080 }; // 1 week = 10080 mins
  return jwt.sign(data, sig, opts);
};

var _decode = function(token) {
  return jwt.verify(token, sig);
};

var _createToken = function(_id) {
  return _generate({ user: _id });
};

exports.generate = _createToken;
exports.decode = _decode;

exports.serialize = function(req, res, next) {
  var token = req.query.auth_token || req.body.auth_token;
  token = (req.headers.authorization) ? req.headers.authorization.split(' ')[1] : token;

  if (!token) {
    if (req.controller.action.scope.indexOf('*') > -1) return next();
    return res.status(401).send({ error: 'No auth token present' });
  }

  try {
    var decoded = _decode(token);
    req.bearerToken = decoded;
    return next();
  } catch(err) {
    return res.status(500).send({ error: err });
  }
}
