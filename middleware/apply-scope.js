'use strict';

/*
  apply-scope.js

  Here we mash all the permissions the user has and determine the one that
  is most advantageous. The one with the best permissions in the current context
  is the one that will be applied.

  If the route does not allow the scope requested, a 401 will be given to the
  user.
*/

var siftPermissionMatrix = function(matrix, scopes) {
  if (matrix === true) return scopes[scopes.length - 1];
  if (matrix === false) return matrix;
  if (typeof matrix !== 'object' || Object.keys(matrix).length === 0) return false;

  var grant = false;

  for (var i = 0; i < scopes.length; i++) {
    if (matrix[scopes[i]]) grant = scopes[i];
  }

  return grant;
};

var determineRequestType = function(req) {
  var methods = ['GET', 'POST', 'PUT', 'DELETE'];
  var action = ['read', 'create', 'edit', 'delete'];
  var index = methods.indexOf(req.method);

  if (index === -1) return 'read';

  return action[index];
};

var getIndex = function(arr, find) {
  var index = arr.indexOf(find);
  return index === -1 ? 0 : index;
};

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      req.appliedScope = '*';

      if (!req.caughtScope || !Array.isArray(req.caughtScope)) return next();
      if (req.caughtScope.join() === '*' && !req.ownership) return next();
      if (!req.user) return next();

      var ownerLevel = getIndex(req.controller.action.scope, 'owner');
      var allLevel = getIndex(req.controller.action.scope, '*');
      var elevatedScopes = req.controller.action.scope.slice(allLevel).slice(ownerLevel);

      if (req.ownership && ownerLevel > -1) {
        req.appliedScope = 'owner';
      }

      if (elevatedScopes.length > 0 && req.caughtScope.length > 1) {
        if (req.controller._rest) {
          var requestType = determineRequestType(req);
          var permissions = req.controller.permissions[requestType] ? req.controller.permissions[requestType] : false;
          var sift = siftPermissionMatrix(permissions, elevatedScopes);

          if (sift) req.appliedScope = sift;
        } else {
          req.appliedScope = elevatedScopes[elevatedScopes.length - 1];
        }
      }

      if (req.controller.action.scope.indexOf(req.appliedScope) === -1) {
        return next({ code: 401 });
      }

      return next();
    }
  }

};
