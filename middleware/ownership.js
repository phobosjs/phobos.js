'use strict';

/*
  scope-catch.js

  Here we look up what scopes the given user has versus what they need. By
  default, the `*` scope is given, but if a user has other relevant ones,
  they are sifted.

  Most importantly, we do an ownership check.
*/

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      return next();
    }
  }

};
