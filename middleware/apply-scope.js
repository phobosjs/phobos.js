'use strict';

/*
  apply-scope.js

  We determine what the user should be given as a response depending on the
  caught scope.

  When no suitable scope is found, a 401 sent instead.
*/

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      return next();
    }
  }

};
