'use strict';

/*
  filter-fields.js

  In the case of either mass assignment of just in general querying a resource,
  we need to filter out what a user is allowed to see.

  Because this is mostly done in the automated resources, we skip all non-RESTful
  endpoints.
*/

var Helpers = require('../lib/helpers');

var filterRecord = function(record, permissions, key) {
  var allowed = permissions[key];

  if (Array.isArray(allowed) && allowed.length === 0) {
    allowed = Object.keys(record);
  };

  if (allowed === false) allowed = [];
  if (allowed.indexOf('_id') === -1) allowed.unshift('_id');

  var cleanResource = {};

  for (var i = 0; i < allowed.length; i++) {
    var isRelation = Object.keys(permissions).indexOf(allowed[i]) > -1;
    var exists = typeof record[allowed[i]] !== 'undefined';

    if (exists && !isRelation) {
      cleanResource[allowed[i]] = record[allowed[i]];
    } else if (exists && isRelation) {
      cleanResource[allowed[i]] = filterRecord(record[allowed[i]], permissions, allowed[i]);
    }
  }

  return cleanResource;
};

module.exports = {

  inject: [  ],

  middleware: function filterFieldsMiddleware() {
    return function filterFields(req, res, next) {
      if (!req.controller._rest) return next();

      var requestType = Helpers.determineRequestType(req);

      var permissions = {
        _root: Helpers.getAllowedFields(
          req.controller.permissions[requestType],
          req.appliedScope
        )
      };

      if (req.hasOwnProperty('includeRelations')) {
        var includables = Object.keys(req.includeRelations);

        for (var r = 0; r < includables.length; r++) {
          permissions[includables[r]] = Helpers.getAllowedFields(
            req.phobos.permissions[req.includeRelations[includables[r]].model][requestType],
            req.appliedScope
          );
        }
      }

      if (Array.isArray(req.rawResources)) {
        req.resource = [];

        for (var i = 0; i < req.rawResources.length; i++) {
          req.resource.push(filterRecord(req.rawResources[i], permissions, '_root'));
        }
      } else {
        req.resource = filterRecord(req.rawResources, permissions, '_root');
      }

      if (req.resource.length < 1) req.rawResourcesCount = 0;

      return next();
    }
  }

};
