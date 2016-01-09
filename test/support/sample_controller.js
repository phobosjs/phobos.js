'use strict';

// This is the controller pattern - takes the DS argument which is the datastore and Mutation which is the CRUD component

module.exports = function(DS, Mutation) {
  return {

    // _mountedAt tells Phobos.js where to mount your resource - should be a plural word
    _mountedAt: 'users',

    // _expose tells Phobos.js which methods to open up to the world for this resource (each corresponds to an object name)
    _expose: ['index', 'show', 'new', 'update', 'delete'],

    index: {

      // The "scope" defines the access levels for this route
      scope: [ '*' ],

      // The final part of the Express.js stack that will render your object
      // req.resource should be used here as it is properly scrubbed for allowed fields as defined in scope.js
      responder: function(req, res, next) {
        res.send({ users: req.resource });
        next();
      }

    },

    show: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        res.send({ users: req.resource });
        next();
      }

    },

    new: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var User = new DS.User(req.body);

        User.save(function(err) {
          res.send(User);
        });
      }

    },

    update: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        res.send({ users: [] });
        next();
      }

    },

    delete: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        res.send({ users: [] });
        next();
      }

    }

  };
};
