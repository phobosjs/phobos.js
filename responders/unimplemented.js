'use strict';

/*
  unimplemented.js

  This responder exists as a placeholder for non-RESTful methods, where the
  response cannot be guessed.
*/

const unimplimentedMethod = function unimplimentedMethod(req, res, next) {
  console.warn('=> Method not implemented.');
  return res.statusCode(501).send();
};

module.exports = unimplimentedMethod;
