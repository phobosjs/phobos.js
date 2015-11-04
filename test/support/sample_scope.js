'use strict';

module.exports = {

  // Each object corresponds to a schema/resource/controller
  User: {


  /*
    Each of these takes several possible options:

      - boolean t/f: a true opens it to all, a false closes to all
      - array of field names: all will have access to this field
      - an object with a list of scopes: each scope can contain boolean t/f or an array of field names
  */

    read: [ 'username', 'updatedAt' ],

    edit: {
      '*': false,
      owner: [ 'username', 'password' ]
    },

    create: true,

    delete: false,

    // searchableBy sets which keys can be used to search for the fields

    searchableBy: [ 'username' ],

    // owners is the field name of the foreign key/rel of the owner of this document type
    owners: [ '_id' ]

  },

  Task: {

    read: true,

    edit: {
      '*': false,
      owner: [ 'title', 'completedAt' ]
    },

    create: true,

    delete: {
      owner: true,
      '*': false
    },

    searchableBy: [],

    owners: [ 'owner' ]

  }

};
