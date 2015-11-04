'use strict';

var JWT = require('jsonwebtoken');

function Bearer(signature, expiry) {
  if (typeof signature === 'undefined') return false;

  this._expiry = expiry || 10080 * 24;  // 1 week = 10080 mins
  this._signature = signature;
  return this;
};

Bearer.prototype.generate = function generate(payload) {
  var opts = { expiresIn: this._expiry };
  return JWT.sign(payload, this._signature, opts);
};

Bearer.prototype.verify = function decode(token) {
  return JWT.verify(token, this._signature);
};

module.exports = Bearer;
