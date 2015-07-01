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
      ownership = Mutation._checkForOwnership(req);
      caughtScope = (ownership) ? 'owner' : Mutation._highestScope(req);
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
      case 'PUT': action = 'edit';
      case 'PATCH': action = 'edit';
      case 'POST': action = 'create';
      case 'DELETE': action = 'delete';
    }

    return action;
  };

  // Checks for the permission to make a new resource
  Mutation.canCreate = function(req) {
    if (req.caughtScope === '*') return true;
    return Mutation._highestScope(req.user.scope);
  };

  // Checks for permission to edit the given resource
  Mutation.canEdit = function(req) {
    return Mutation.canCreate(req) || Mutation._checkForOwnership(req.resourceModel, req.resources, req.user._id);
  };

  // Checks for permission to delete the resource
  Mutation.canDelete = function(req) {
    return Mutation.canCreate(req) || Mutation._checkForOwnership(req.resourceModel, req.resources, req.user._id);
  };

  // Makes sure that write scpes are respected
  Mutation._sanitizeFields = function(permissions, params, allowance) {
    var allowed = [];

    if (permissions === true) {
      allowed = true;
    } else if (permissions[allowance] && permissions[allowance] === true) {
      allowed = true;
    } else if (typeof permissions[allowance] === 'object') {
      allowed = allowed.concat(permissions[allowance]);
    }

    return Mutation._filterFromResource(params, allowed);
  };

  // Helper for the _sanitizeFields() method
  Mutation._filterFromResource = function(params, allowed) {
    if (allowed === true) return params;
    var safe = {};

    for (var i = 0; i < allowed.length; i++) {
      safe[allowed[i]] = params[allowed[i]];
    }

    return safe;
  };

  // Checks for the highest level the user has
  Mutation._highestScope = function(scopes) {


    return false;
  };

  // Does the user own the resource in question?
  Mutation._checkForOwnership = function(model, object, user) {
    if (!Scopes[model].owners || object.isNew) return false;
    if (Array.isArray(object) && object.length < 1) return true;

    for (var i = 0; i < Scopes[model].owners.length; i++) {
      if (object[Scopes[model].owners[i]].toString() === user.toString()) return true;
    }

    return false;
  };

  return Mutation;
};
