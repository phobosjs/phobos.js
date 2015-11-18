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
      req.ownership = false;

      if (!req.user) return next();
      if (!req.controller.permissions.owners || !Array.isArray(req.controller.permissions.owners)) return next();
      if (Array.isArray(req.rawResources)) return next();

      for (var i = 0; i < req.controller.permissions.owners.length; i++) {
        if (req.user._id.toString() === req.rawResources[req.controller.permissions.owners[i]].toString()) req.ownership = true;
      }

      return next();
    }
  }

};
