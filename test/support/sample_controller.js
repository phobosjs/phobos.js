'use strict';

// This is the controller pattern - takes the DS argument which is the datastore and Mutation which is the CRUD component

module.exports = function(DS) {
  return {

    _mountedAt: 'users',
    _expose: ['index', 'show', 'new', 'update', 'delete']

  };
};
