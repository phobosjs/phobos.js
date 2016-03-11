'use strict';

/*
  default.js

  These responders will be used as defaults. Responder functions in the
  controllers of the application will always be prioritized over these.
*/

function envelope(resource, data) {
  const formatted = {};
  formatted[resource] = data;

  return formatted;
}

module.exports = function defaultResponder(DS) {
  return {

    index: {

      scope: [ '*' ],

      responder: (req, res, next) => {
        return res.send(envelope(req.path.split('/')[1], req.resource));
      }

    },

    show: {

      scope: [ '*' ],

      responder: (req, res, next) => {
        return res.send(envelope(req.path.split('/')[1], req.resource));
      }

    },

    new: {

      scope: [ '*' ],

      responder: (req, res, next) => {
        return res.send(envelope(req.path.split('/')[1], req.resource));
      }

    },

    update: {

      scope: [ '*' ],

      responder: (req, res, next) => {
        return res.send(envelope(req.path.split('/')[1], req.resource));
      }

    },

    delete: {

      scope: [ '*' ],

      responder: (req, res, next) => {
        return res.send(envelope(req.path.split('/')[1], req.resource));
      }

    }

  };
};
