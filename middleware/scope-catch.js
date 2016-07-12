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

  for (const scope of endpointScopes) {
    if (userScopes.indexOf(scope) > -1) scopes.push(scope);
  }

  return scopes;
}

module.exports = {

  inject: [  ],

  middleware: function scopeCatchMiddlware() {
    return function scopeCatch(req, res, next) {
      const endpointScopes = req.controller.scopes;
      req.caughtScope = [];

      if (req.user) {
        req.caughtScope = catchScopes(req.user.scope, endpointScopes);
      }

      if (req.caughtScope.length < 1 && endpointScopes.indexOf('*') > -1) req.caughtScope.push('*');

      if (req.caughtScope.length < 1) return next({
        translation: 'api.error.auth.insufficient_privilege',
        code: 401
      });

      return next();
    };
  }

};
