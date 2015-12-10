'use strict';

// We create a function that takes a parameter for the Mongoose library
module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var ObjectId = Schema.Types.ObjectId;

  // The Schemas object is what we're going to return/export
  var Schemas = {};

  // The user schema - note the "scope" field
  Schemas.User = new Schema({
    username: { type: String, required: true },
    password: { type: String },
    scope: { type: Array, required: true, default: [ 'user' ]},
    updatedAt: { type: Date, default: new Date() }
  });

  // A task belongs to the user, and its access needs to be managed later on
  Schemas.Task = new Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false, required: true },
    owner: { type: ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: new Date() }
  });

  // Return our bundle of schemas for import into Phobos
  return Schemas;

};
