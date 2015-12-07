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
      req.includeRelations = [];

      if (!req.query.include || req.query.include === '') return next();

      var relations = req.query.include.split(',');
      var model = DS[req.controller.model];

      for (var i = 0; i < relations.length; i++) {
        if (model.schema.paths[relations[i]]) {
          var relation = {
            model: model.schema.tree[relations[i]].ref,
            field: relations[i]
          };

          req.includeRelations.push(relation);
        }
      }

      return next();
    }
  }

};
