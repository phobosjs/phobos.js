'use strict';

/*
  includables.js

  Queries run with the `include` parameter should populate objects that are
  requested
*/

module.exports = {

  inject: [ 'DS' ],

  middleware: function includablesMiddleware(DS) {
    return function includables(req, res, next) {
      req.includeRelations = {};

      if (!req.query.include || req.query.include === '') return next();

      let relations = req.query.include.split(',');
      let model = DS[req.controller.model];

      for (let relatable of relations) {
        if (model.schema.paths[relatable]) {
          let relation = {
            model: model.schema.tree[relatable].ref,
            field: relatable
          };

          req.includeRelations[relatable] = relation;
        }
      }

      return next();
    };
  }

};
