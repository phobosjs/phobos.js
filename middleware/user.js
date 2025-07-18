"use strict";

module.exports = {
  inject: ["DS"],

  middleware: function userMiddleware(DS) {
    return function user(req, res, next) {
      if (!req.bearerToken) return next();

      const User = DS[req.phobos.options.scopeCarrier.model];

      User.findOne({ _id: req.bearerToken })
        .lean()
        .exec()
        .then((user) => {
          if (!user) return next();

          req.user = user;
          return next();
        })
        .catch((err) => next(err));
    };
  },
};
