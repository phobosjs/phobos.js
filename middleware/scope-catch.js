'use strict';

/*
  scope-catch.js

  Here we look up what scopes the given user has versus what they need. By
  default, the `*` scope is given, but if a user has other relevant ones,
  they are sifted.

  The final list of scopes will contain only scopes both the user and the route
  share, with the exception of `*`, which is always present.
*/

var catchScopes = function(userScopes, endpointScopes) {
  var scopes = [];

  for (var i = 0; i < endpointScopes.length; i++) {
    if (userScopes.indexOf(endpointScopes[i]) > -1) scopes.push(endpointScopes[i]);
  }

  return scopes;
};

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      req.caughtScope = [ '*' ];

      if (req.user) {
        var availableScopes = req.phobos.options.availableScopes;
        var userScopes = req.user.scope;
        var endpointScopes = req.controller.scopes;

        req.caughtScope = catchScopes(userScopes, endpointScopes);
      }

      return next();
    }
  }

};
