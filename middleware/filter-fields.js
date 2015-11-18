'use strict';

/*
  filter-fields.js

  In the case of either mass assignment of just in general querying a resource,
  we need to filter out what a user is allowed to see.
*/

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      return next();
    }
  }

};
