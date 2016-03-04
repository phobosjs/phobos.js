'use strict';

/*
  user.js

  Since we have a bearer token, we should figure out what user it belongs to and
  set that user to the req.user object for use downstream.
*/

module.exports = {

  inject: [ 'DS' ],

  middleware: function userMiddleware(DS) {
    return function user(req, res, next) {
      if (!req.bearerToken) return next();

      const User = DS[req.phobos.options.scopeCarrier.model];
      const query = User.findOne({ _id: req.bearerToken });

      query.lean().exec((err, user) => {
        if (err) return next(err);
        if (!user) return next();

        req.user = user;
        return next();
      });
    };
  }

};
