'use strict';

/*
  default.js

  These responders will be used as defaults. Responder functions in the
  controllers of the application will always be prioritized over these.
*/

module.exports = function(DS, Mutation) {
  return {

    index: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        return res.send({ users: req.resource });
      }

    },

    show: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        return res.send({ users: req.resource });
      }

    },

    new: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var User = new DS.User(req.body);

        User.save(function(err) {
          return res.send(User);
        });
      }

    },

    update: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        return res.send({ users: [] });
      }

    },

    delete: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        return res.send({ users: [] });
      }

    }

  };
};
