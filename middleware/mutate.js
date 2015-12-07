'use strict';

/*
  mutate.js

  Mutations control writing - there are three possible scenarios that require
  this step, and that's creating, editing and deleting.
*/

module.exports = {

  inject: [ 'DS' ],

  middleware: function mutateMiddleware(DS) {
    return function mutate(req, res, next) {
      return next();
    };
  }

};
