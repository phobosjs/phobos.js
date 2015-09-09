'use strict';

var RSVP = require('rsvp');

module.exports = {

  inject: [ 'DS' ],

  middleware: function(DS) {

    var lookup = function(query) {
      return new RSVP.Promise(function(resolve, reject) {
        query.exec(function(err, result) {
          if (err) return reject(err);
          return resolve(result);
        });
      });
    };

    return function(req, res, next) {
      var Model = DS[req.controller.model];
      req.rawResources = {};

      if (req.params.id) {
        var q = Model.findById(req.params.id);

        return lookup(q.lean()).then(function(result) {
          req.rawResources = result;
          return next();
        }).catch(function(err) {
          return next(err);
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
