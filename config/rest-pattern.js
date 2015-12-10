'use strict';

/*
  rest-pattern.js
  
  This is the base pattern in which resources will be created.
*/

var REST = {
  index: { endpoint: '/', method: 'get' },
  new: { endpoint: '/', method: 'post' },
  show: { endpoint: '/:id', method: 'get' },
  update: { endpoint: '/:id', method: 'put' },
  delete: { endpoint: '/:id', method: 'delete' }
};

module.exports = REST;
