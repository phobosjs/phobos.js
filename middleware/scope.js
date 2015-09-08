'use strict';

module.exports = {

  inject: [  ],

  middleware: function() {
    return function(req, res, next) {
      return next();
    }
  }

};
