'use strict';

/*
  default.js

  These responders will be used as defaults. Responder functions in the
  controllers of the application will always be prioritized over these.
*/

module.exports = function(DS) {
  return {

    index: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var envelope = {};
        envelope[req.path.split('/')[1]] = req.resource;

        return res.send(envelope);
      }

    },

    show: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var envelope = {};
        envelope[req.path.split('/')[1]] = req.resource;

        return res.send(envelope);
      }

    },

    new: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var envelope = {};
        envelope[req.path.split('/')[1]] = req.resource;

        return res.send(envelope);
      }

    },

    update: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var envelope = {};
        envelope[req.path.split('/')[1]] = req.resource;

        return res.send(envelope);
      }

    },

    delete: {

      scope: [ '*' ],

      responder: function(req, res, next) {
        var envelope = {};
        envelope[req.path.split('/')[1]] = req.resource;

        return res.send(envelope);
      }

    }

  };
};
