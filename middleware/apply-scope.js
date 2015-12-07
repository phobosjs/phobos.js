'use strict';

/*
  apply-scope.js

  Here we mash all the permissions the user has and determine the one that
  is most advantageous. The one with the best permissions in the current context
  is the one that will be applied.

  If the route does not allow the scope requested, a 401 will be given to the
  user.
*/

var Helpers = require('../lib/helpers');

var getIndex = function(arr, find) {
  var index = arr.indexOf(find);
  return index === -1 ? 0 : index;
};

module.exports = {

  inject: [  ],

  middleware: function applyScopeMiddleware() {
    return function applyScope(req, res, next) {
      req.appliedScope = '*';

      if (!req.caughtScope || !Array.isArray(req.caughtScope)) return next();
      if (!req.user) return next();
      if (req.caughtScope.join() === '*' && !req.ownership) return next();

      var ownerLevel = getIndex(req.controller.scopes, 'owner');
      var allLevel = getIndex(req.controller.scopes, '*');
      var elevatedScopes = req.controller.scopes.slice(allLevel).slice(ownerLevel);

      if (elevatedScopes.length > 0 && req.caughtScope.length > 1) {
        if (req.controller._rest) {
          var requestType = Helpers.determineRequestType(req);
          var permissions = req.controller.permissions[requestType] ? req.controller.permissions[requestType] : false;
          var sift = Helpers.siftPermissionMatrix(permissions, elevatedScopes);

          if (sift) req.appliedScope = sift;
        } else {
          req.appliedScope = elevatedScopes[elevatedScopes.length - 1];
        }
      }

      if (req.controller.scopes.join() === '*') {
        if (req.user.scope.length > 1) {
          req.appliedScope = req.user.scope[req.user.scope.length - 1];
        }
      }

      if (req.ownership && req.appliedScope === '*') {
        req.appliedScope = 'owner';
      }

      return next();
    }
  }

};
