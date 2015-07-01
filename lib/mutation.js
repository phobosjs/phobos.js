'use strict';

var Inflector = require('inflected');

module.exports = function(DS, PhobosInstance) {
  var Mutation = {};

  // Sanitizes params
  Mutation.params = function(req) {
    var userScope = (req.user) ? Mutation._highestScope(req.user.scope) : false;
    var permissions = Scopes[req.resourceModel].write;
    var ownership = (req.user) ? Mutation._checkForOwnership(req.resourceModel, req.resources, req.user._id) : false;

    if (req.resources !== {} && (userScope || ownership)) {
      var object = req.route.path.split('/')[1];
      var allowance = ((userScope) ? userScope : false) || ((ownership) ? 'owner' : false);

      return Mutation._sanitizeFields(permissions, req.body[Inflector.singularize(object)], allowance);
    }

    return {};
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
    if (scopes.indexOf('admin') > -1) return 'admin';
    if (scopes.indexOf('client') > -1) return 'client';

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
