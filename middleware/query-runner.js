'use strict';

/*
  query-runner.js

  This is where we query the database for the actual resource(s) and apply any
  default constraints that we might need to.
*/

module.exports = {

  inject: [ 'DS' ],

  middleware: function(DS) {

    return function(req, res, next) {
      var Model = DS[req.controller.model];
      req.rawResources = {};

      var query = false;
      var count = false;

      if (req.params.id) {
        query = Model.findById(req.params.id).lean();
      } else if (!req.params.id && req.method === 'GET') {
        query = Model.find(req.searchParams);
        count = Model.count(req.searchParams);

        if (req.query.page) {
          var perPage = parseInt(req.query.perPage) || 20;

          query = query.skip((parseInt(req.query.page) * perPage) - perPage);
          query = query.limit(perPage);
        } else {
          query = query.limit(req.query.limit || 20);
        }

        if (req.method === 'GET') query = query.lean();
      } else {
        return next();
      }

      if (req.includeRelations && req.includeRelations.length > 0) {
        for (var i = 0; i < req.includeRelations.length; i++) {
          var relation = req.includeRelations[i];

          query = query.populate(relation.field);
        }
      }

      query.exec(function(err, result) {
        if (err) return next(err);

        req.rawResources = result;

        if (!count) return next();

        count.exec(function(err, counter) {
          if (err) return next(err);

          req.rawResourcesCount = counter;
          return next();
        });
      });
    }

  }

};
