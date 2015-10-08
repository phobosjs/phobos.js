'use strict';

module.exports = {

  inject: [ 'DS' ],

  middleware: function(DS) {

    return function(req, res, next) {
      var Model = DS[req.controller.model];
      req.rawResources = {};

      if (req.params.id) {
        var q = Model.findById(req.params.id).lean();

        q.exec(function(err, result) {
          if (err) return next(err);

          req.rawResources = result;
          return next();
        });
      } else if (!req.params.id && req.method === 'GET') {
        var q = Model.find(req.searchParams);
        var count = Model.count(req.searchParams);

        if (req.query.page) {
          var perPage = parseInt(req.query.perPage) || 20;
          q.skip((parseInt(req.query.page) * perPage) - perPage);
          q.limit(perPage);
        } else {
          q.limit(req.query.limit || 20);
        }

        q.lean().exec(function(err, result) {
          if (err) return next(err);

          count.lean().exec(function(err, counter) {
            if (err) return next(err);

            req.rawResources = result;
            req.rawResourcesCount = counter;
            return next();
          });
        });
      } else {
        return next();
      }
    }

  }

};
