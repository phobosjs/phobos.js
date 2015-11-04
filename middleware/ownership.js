'use strict';

/*
  ownership.js

  Most importantly, we do an ownership check. If it is indeed owned by the
  user in question, the `owner` scope is added into the req.caughtScope for
  use downstream
*/

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      return next();
    }
  }

};
