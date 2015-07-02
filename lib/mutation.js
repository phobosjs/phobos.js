'use strict';

var Inflector = require('inflected');

module.exports = function(DS, PhobosInstance) {
  var Mutation = {};

  // Sanitizes params
  Mutation.params = function(req) {
    var caughtScope = '*';
    var action = Mutation._getAction(req.method);
    var permissions = req.controller.permissions[action];
    var params = req.body[Inflector.underscore(req.controller.model)];
    var ownership = false;

    if (req.user) {
      var userScopes = req.user[PhobosInstance.scopable.field];
      ownership = (action === 'create') ? false : Mutation._checkForOwnership(req);
      caughtScope = (ownership) ? 'owner' : Mutation._highestScope(permissions, userScopes);
    }

    if (permissions === true || permissions[caughtScope] === true) {
      // If the permission for the given action is set to true
      return Mutation._sanitizeFields(params);

    } else if (Array.isArray(permissions)) {
      // If a list of fields are given for the action for all scopes
      return Mutation._sanitizeFields(params, permissions);

    } else if (Array.isArray(permissions[caughtScope])) {
      // If a list of fields are given for the current scope
      return Mutation._sanitizeFields(params, permissions[caughtScope]);

    } else {
      // Catch-all for the failure of previous checks - allows nothing through
      return {};

    }
  };

  // Returns the appropreate action for the request
  Mutation._getAction = function(method) {
    var action = false;

    switch (method) {
      case 'PUT': action = 'edit'; break;
      case 'PATCH': action = 'edit'; break;
      case 'POST': action = 'create'; break;
      case 'DELETE': action = 'delete'; break;
    }

    return action;
  };

  // Helper method to check for scope and permissions to create
  Mutation.canCreate = function(req) {
    return Mutation._checkCredentials(req);
  };

  // Helper method to check for scope and permissions to edit
  Mutation.canEdit = function(req) {
    return Mutation._checkCredentials(req);
  };

  // Helper method to check for scope and permissions to delete
  Mutation.canDelete = function(req) {
    return Mutation._checkCredentials(req);
  };

  // Checks the credentials of scope against endpoint permissions
  Mutation._checkCredentials = function(req) {
    var caughtScope = '*';
    var action = Mutation._getAction(req.method);
    var permissions = req.controller.permissions[action];
    var ownership = false;

    if (req.user) {
      var userScopes = req.user[PhobosInstance.scopable.field];
      ownership = (action === 'create') ? false : Mutation._checkForOwnership(req);
      caughtScope = (ownership) ? 'owner' : Mutation._highestScope(permissions, userScopes);
    }

    if (permissions === true || permissions[caughtScope] === true) return true;
    if (Array.isArray(permissions) || Array.isArray(permissions[caughtScope])) return true;

    return false;
  }

  // Makes sure that write scopes are respected
  Mutation._sanitizeFields = function(params, permissions) {
    if (typeof permissions === 'undefined') return params;
    var cleanParams = {};

    for (var n in params) {
      if (permissions.indexOf(n) > -1) cleanParams[n] = params[n];
    }

    return cleanParams;
  };

  // Checks for the highest level the user has by counting the amount of fields
  Mutation._highestScope = function(permissions, scopes) {
    if (typeof permissions === 'undefined') return '*';

    var highest = 0;
    var fieldCount = 0;

    scopes.unshift('*');

    for (var i = 0; i < scopes.length; i++) {
      if (permissions === true || Array.isArray(permissions)) {
        return '*';
      } else if (permissions[scopes[i]] === true) {
        return scopes[i];
      } else if (Array.isArray(permissions[scopes[i]]) && (fieldCount < permissions[scopes[i]].length)) {
        highest = i;
        fieldCount = permissions[scopes[i]].length;
      }
    }

    return scopes[highest];
  };

  // Does the user own the resource in question?
  Mutation._checkForOwnership = function(req) {
    var model = req.controller.model;
    var permissions = req.controller.permissions;

    if (!permissions.owners) return false;
    if (Array.isArray(req.resource)) return false;
    if (!req.user) return false;

    for (var i = 0; i < permissions.owners.length; i++) {
      if (req.resource[permissions.owners[i]].toString() === req.user._id.toString()) return true;
    }

    return false;
  };

  return Mutation;
};
