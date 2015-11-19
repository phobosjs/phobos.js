'use strict';

/*
  middleware-manifest.js
  
  This has a list of all the middleware in Phobos's default stack. Additional 
  middleware can be added into the stack after these.
*/

var MiddlewareStack = [
  'base',
  'bearer',
  'user',
  'query-parser',
  'includables',
  'query-runner',
  'scope-catch',
  'ownership',
  'apply-scope',
  'filter-fields'
];

module.exports = MiddlewareStack;
