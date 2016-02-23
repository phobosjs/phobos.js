'use strict';

/*
  query-parser.js

  On a RESTful route, a database resource should be associated with it. Here,
  we parse the potential query logic for the querying of the resource.
*/

module.exports = {

  inject: [ ],

  middleware: function queryParserMiddleware() {

    return function queryParser(req, res, next) {
      req.searchParams = {};

      if (!req.params.id && req.controller.permissions.searchableBy) {
        let allowed = req.controller.permissions.searchableBy;

        for (let field of allowed) {
          if (req.parsedQuery[field]) req.searchParams[field] = req.parsedQuery[field];
        }
      }

      return next();
    };

  }

};
