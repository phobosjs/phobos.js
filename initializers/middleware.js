'use strict';

module.exports = function() {

  _stack: [],
  _legend: [],

  add: function(name, func, position) {
    
  },

  remove: function(name) {

  },

  replace: function(name, func) {

  },

  run: function(req, res, next) {
    for (var i = 0; i < this._stack.length; i++) this._stack[i](req, res, next);
  }

};
