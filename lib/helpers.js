'use strict';

exports.siftPermissionMatrix = function(matrix, scopes) {
  if (matrix === true) return scopes[scopes.length - 1];
  if (matrix === false) return matrix;
  if (typeof matrix !== 'object' || Object.keys(matrix).length === 0) return false;

  let grant = false;

  for (let s of scopes) {
    if (matrix[scopes[s]]) grant = scopes[s];
  }

  return grant;
};

exports.determineRequestType = function(req) {
  let methods = ['GET', 'POST', 'PUT', 'DELETE'];
  let action = ['read', 'create', 'edit', 'delete'];
  let index = methods.indexOf(req.method);

  if (index === -1) return 'read';

  return action[index];
};

exports.getAllowedFields = function(matrix, scope) {
  let grant = false;

  if (matrix === true) grant = [];

  if (matrix.hasOwnProperty(scope) && matrix[scope] === true) {
    grant = [];
  } else if (matrix.hasOwnProperty(scope) && Array.isArray(matrix[scope])) {
    grant = matrix[scope];
  }

  return grant;
};
