'use strict';

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
