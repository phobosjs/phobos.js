'use strict';

module.exports = {

  inject: [ ],

  middleware: function() {

    return function(req, res, next) {
      req.searchParams = {};

      if (!req.params.id && req.controller.permissions.searchableBy) {
        var allowed = req.controller.permissions.searchableBy;

        for (var i = 0; i < allowed.length; i++) {
          if (req.parsedQuery[allowed[i]]) req.searchParams[allowed[i]] = req.parsedQuery[allowed[i]];
        }
      }

      return next();
    }

  }

};
