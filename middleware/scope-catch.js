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
  const scopes = [];

  for (let scope of endpointScopes) {
    if (userScopes.indexOf(scope) > -1) scopes.push(scope);
  }

  if (scopes.length === 0 && endpointScopes.indexOf('*')) scopes.push('*');

  return scopes;
}

module.exports = {

  inject: [  ],

  middleware: function scopeCatchMiddlware() {
    return function scopeCatch(req, res, next) {
      req.caughtScope = [ '*' ];

      if (req.user) {
        const availableScopes = req.phobos.options.scopeCarrier.availableScopes;
        const userScopes = req.user.scope;
        const endpointScopes = req.controller.scopes;

        req.caughtScope = catchScopes(userScopes, endpointScopes);
      }

      console.log(req.caughtScope);

      return next();
    };
  }

};
