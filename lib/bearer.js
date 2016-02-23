'use strict';

const JWT = require('jsonwebtoken');

class Bearer {

  constructor(signature, expiry) {
    if (typeof signature === 'undefined') return false;

    this._expiry = expiry || 10080 * 24;  // 1 week = 10080 mins
    this._signature = signature;
    return this;
  }

  generate(payload) {
    let opts = { expiresIn: this._expiry };
    return JWT.sign({ payload: payload }, this._signature, opts);
  }

  verify(token) {
    let decoded = JWT.verify(token, this._signature);
    return decoded.payload;
  }

}

module.exports = Bearer;
