'use strict';

/*
  mutate.js

  Mutations control writing - there are three possible scenarios that require
  this step, and that's creating, editing and deleting.
*/

var Inflector = require('inflected');
var Helpers = require('../lib/helpers');

module.exports = {

  inject: [ 'DS' ],

  middleware: function mutateMiddleware(DS) {
    return function mutate(req, res, next) {
      req.mutated = false;

      var requestType = Helpers.determineRequestType(req);
      var permissions = req.controller.permissions[requestType];

      if (['edit', 'create', 'delete'].indexOf(requestType) === -1) return next();

      var resource = Inflector.singularize(req.path.split('/')[1]);
      var params = req.body[resource];

      if ((!resource && req.controller._rest) && (!params || requestType !== 'delete')) return next({
        translation: 'api.error.auth.invalid_request',
        code: 400
      });

      if (requestType === 'delete') {
        req.rawResources.remove(function(err) {
          req.mutated = true;
          req.rawResources = undefined;

          return next(err);
        });
      } else {
        var allowedFields = Helpers.getAllowedFields(permissions, req.appliedScope);

        if (!allowedFields) return next({
          translation: 'api.error.auth.insufficient_privilege',
          code: 401
        });

        var diffs = {};

        if (Array.isArray(allowedFields) && allowedFields.length === 0) {
          diffs = params;
        } else {
          for (var p in params) {
            if (allowedFields.indexOf(p) > -1) diffs[p] = params[p];
          }
        }

        if (Object.keys(req.rawResources).length === 0) {
          var Model = DS[req.controller.model];
          req.rawResources = new Model(diffs);
        } else {
          for (var p in diffs) req.rawResources[p] = diffs[p];
        }

        console.log(req.rawResources);

        req.rawResources.save(function(err) {
          req.mutated = true;
          return next(err);
        });
      }
    };
  }

};
