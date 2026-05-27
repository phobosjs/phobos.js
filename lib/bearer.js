'use strict';

const JWT = require('jsonwebtoken');

class Bearer {

  constructor(signature, expiry) {
    if (typeof signature === 'undefined') return false;

    this._expiry = expiry || '1d';
    this._signature = signature;
    return this;
  }

  generate(payload) {
    const opts = { expiresIn: this._expiry };
    return JWT.sign({ payload: payload }, this._signature, opts);
  }

  verify(token) {
    const decoded = JWT.verify(token, this._signature);
    return decoded.payload;
  }

}

module.exports = Bearer;
