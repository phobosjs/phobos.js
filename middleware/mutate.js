"use strict";

/*
  mutate.js

  Mutations control writing - there are three possible scenarios that require
  this step, and that's creating, editing and deleting.
*/

const Inflector = require("inflected");
const Helpers = require("../lib/helpers");

module.exports = {
  inject: ["DS"],

  middleware: function mutateMiddleware(DS) {
    return function mutate(req, res, next) {
      req.mutated = false;

      const requestType = Helpers.determineRequestType(req);
      const permissions = req.controller.permissions[requestType];

      if (["edit", "create", "delete"].indexOf(requestType) === -1)
        return next();

      const resource = Inflector.singularize(req.path.split("/")[1]);
      const params = req.body[resource];

      if (
        !resource &&
        req.controller._rest &&
        (!params || requestType !== "delete")
      )
        return next({
          translation: "api.error.auth.invalid_request",
          code: 400,
        });

      if (requestType === "delete") {
        req.rawResources
          .deleteOne()
          .then(() => {
            req.mutated = true;
            req.rawResources = undefined;
            next();
          })
          .catch(next);
      } else {
        const allowedFields = Helpers.getAllowedFields(
          permissions,
          req.appliedScope
        );

        if (!allowedFields)
          return next({
            translation: "api.error.auth.insufficient_privilege",
            code: 401,
          });

        let diffs = {};

        if (Array.isArray(allowedFields) && allowedFields.length === 0) {
          diffs = params;
        } else {
          for (let p in params) {
            if (allowedFields.indexOf(p) > -1) diffs[p] = params[p];
          }
        }

        if (Object.keys(req.rawResources).length === 0) {
          const Model = DS[req.controller.model];
          req.rawResources = new Model(diffs);
        } else {
          for (let p in diffs) req.rawResources[p] = diffs[p];
        }

        req.rawResources.$__save({}, (err) => {
          req.mutated = true;
          return next(err);
        });
      }
    };
  },
};
