'use strict';

/*
  filter-fields.js

  In the case of either mass assignment of just in general querying a resource,
  we need to filter out what a user is allowed to see.

  Because this is mostly done in the automated resources, we skip all non-RESTful
  endpoints.
*/

const Helpers = require('../lib/helpers');

function filterRecord(record, permissions, key) {
  let allowed = permissions[key];

  if (typeof record === 'undefined' || record === null) return record;
  if (typeof record.toObject === 'function') record = record.toObject();

  if (Array.isArray(allowed) && allowed.length === 0) {
    allowed = Object.keys(record);
  }

  if (Array.isArray(allowed) && allowed.indexOf('_id') === -1) allowed.unshift('_id');
  if (allowed === false) allowed = [];

  const cleanResource = {};

  for (const field of allowed) {
    // Remove extra id virtual param from Mongoose
    if (field === 'id') continue;
    if (record[field].hasOwnProperty('id')) delete record[field].id;

    const isRelation = Object.keys(permissions).indexOf(field) > -1;
    const exists = typeof record[field] !== 'undefined';

    if (exists && !isRelation) {
      cleanResource[field] = record[field];
    } else if (exists && isRelation) {
      cleanResource[field] = key === '_root' ? filterRecord(record[field], permissions, field) : record[field];
    }
  }

  return cleanResource;
}

module.exports = {

  inject: [  ],

  middleware: function filterFieldsMiddleware() {
    return function filterFields(req, res, next) {
      if (!req.controller._rest) return next();

      const requestType = Helpers.determineRequestType(req);

      const permissions = {
        _root: Helpers.getAllowedFields(
          req.controller.permissions[requestType],
          req.appliedScope
        )
      };

      if (req.hasOwnProperty('includeRelations')) {
        const includables = Object.keys(req.includeRelations);

        for (const includable of includables) {
          permissions[includable] = Helpers.getAllowedFields(
            req.phobos.permissions[req.includeRelations[includable].model][requestType],
            req.appliedScope
          );
        }
      }

      if (Array.isArray(req.rawResources)) {
        req.resource = [];

        for (const rawResource of req.rawResources) {
          const record = filterRecord(rawResource, permissions, '_root');
          if (Object.keys(record).length > 0) req.resource.push(record);
        }
      } else if (req.rawResources) {
        const resource = filterRecord(req.rawResources, permissions, '_root');
        req.resource = Object.keys(resource).length > 0 ? resource : {};
      }

      if (!req.resource || req.resource.length < 1) req.rawResourcesCount = 0;
      if (req.rawResources === null) return next({ status: 404 });

      return next();
    };
  }

};
