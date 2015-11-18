'use strict';

/*
  filter-fields.js

  In the case of either mass assignment of just in general querying a resource,
  we need to filter out what a user is allowed to see.

  Because this is mostly done in the automated resources, we skip all non-RESTful
  endpoints.
*/

var determineRequestType = function(req) {
  var methods = ['GET', 'POST', 'PUT', 'DELETE'];
  var action = ['read', 'create', 'edit', 'delete'];
  var index = methods.indexOf(req.method);

  if (index === -1) return 'read';

  return action[index];
};

var filter = function(record, allowed) {
  if (Array.isArray(allowed) && allowed.length === 0) return record;
  if (allowed === false) allowed = [];
  if (allowed.indexOf('_id') === -1) allowed.unshift('_id');

  var cleanResource = {};

  for (var i = 0; i < allowed.length; i++) {
    if (record[allowed[i]]) cleanResource[allowed[i]] = record[allowed[i]];
  }

  return cleanResource;
};

var getFields = function(matrix, scope) {
  var grant = false;

  if (matrix === true) grant = [];

  if (matrix.hasOwnProperty(scope) && matrix[scope] === true) {
    grant = [];
  } else if (matrix.hasOwnProperty(scope) && Array.isArray(matrix[scope])) {
    grant = matrix[scope];
  }

  return grant;
};

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      if (!req.controller._rest) return next();

      var requestType = determineRequestType(req);
      var permissions = req.controller.permissions[requestType];
      var allowed = getFields(permissions, req.appliedScope);

      if (Array.isArray(req.rawResources)) {
        req.resource = [];

        for (var i = 0; i < req.rawResources.length; i++) {
          req.resource.push(filter(req.rawResources[i], allowed));
        }
      } else {
        req.resource = filter(req.rawResources, allowed);
      }

      return next();
    }
  }

};
