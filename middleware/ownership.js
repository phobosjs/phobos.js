'use strict';

/*
  ownership.js

  Most importantly, we do an ownership check. If it is indeed owned by the
  user in question, the `owner` scope is added into the req.caughtScope for
  use downstream
*/

module.exports = {

  inject: [  ],

  middleware: function ownershipMiddleware() {
    return function ownership(req, res, next) {
      req.ownership = false;

      if (!req.user) return next();
      if (!req.controller.permissions.owners || !Array.isArray(req.controller.permissions.owners)) return next();
      if (Array.isArray(req.rawResources)) return next();

      for (let owner of req.controller.permissions.owners) {
        let userId = req.user._id;
        let resourceOwnerId = req.rawResources[owner];

        if (userId && resourceOwnerId && (userId.toString() === resourceOwnerId.toString())) {
          req.ownership = true;
        }
      }

      return next();
    };
  }

};
