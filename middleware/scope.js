'use strict';

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      req.caughtScope = '*';
      var ownership = false;
      var permissions = req.controller.permissions;

      return next();
    }
  }

};
