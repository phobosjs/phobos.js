'use strict';

/*
  user.js

  Since we have a bearer token, we should figure out what user it belongs to and
  set that user to the req.user object for use downstream.
*/

module.exports = {

  inject: [ 'DS' ],

  middleware: function(DS) {
    return function(req, res, next) {
      if (!req.bearerToken) return next();

      var User = DS[req.phobos.options.scopeCarrier.model];
      var query = User.findOne({ _id: req.bearerToken.user });

      query.lean().exec(function(err, user) {
        if (err) return next(err);

        req.user = user;
        return next();
      });
    }
  }

};
