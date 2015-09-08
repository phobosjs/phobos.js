'use strict';

module.exports = function(DS) {
  return function(req, res, next) {
    if (!req.bearerToken) return next();

    var User = DS[Instance.scopable.model];
    var query = User.findOne({ _id: req.bearerToken.user });

    query.lean().exec(function(err, user) {
      if (err) return next(err);

      req.user = user;
      return next();
    });
  }
};
