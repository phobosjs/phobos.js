'use strict';

/*
  scope-catch.js

  Here we look up what scopes the given user has versus what they need. By
  default, the `*` scope is given, but if a user has other relevant ones,
  they are sifted.

  The final list of scopes will contain only scopes both the user and the route
  share, with the exception of `*`, which is always present.
*/

function catchScopes(userScopes, endpointScopes) {
  let scopes = [];

  for (let scope of endpointScopes) {
    if (userScopes.indexOf(scope) > -1) scopes.push(scope);
  }

  return scopes;
}

module.exports = {

  inject: [  ],

  middleware: function scopeCatchMiddlware() {
    return function scopeCatch(req, res, next) {
      req.caughtScope = [ '*' ];

      if (req.user) {
        let availableScopes = req.phobos.options.scopeCarrier.availableScopes;
        let userScopes = req.user.scope;
        let endpointScopes = req.controller.scopes;

        req.caughtScope = catchScopes(userScopes, endpointScopes);
      }

      return next();
    };
  }

};
