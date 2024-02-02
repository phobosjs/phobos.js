"use strict";

const express = require("express");
const mongoose = require("mongoose");
const PhobosRouter = require("./router");
const TokenLib = require("./bearer");

class Phobos {
  constructor(options) {
    this._options = {
      port: 9292,
      appName: "Phobos.js",
      bearerTokenSignature: null,
      bearerTokenExpiry: "180d",
      dbUri: "mongodb://localhost/phobos",
      scopeCarrier: {
        model: "User",
        field: "scope",
        availableScopes: ["*", "user", "owner", "admin"],
      },
      errorHandler: false,
      testMode: false,
    };

    for (let p in options) {
      if (this._options.hasOwnProperty(p)) this._options[p] = options[p];
    }

    // Initialize the Express.js server
    this.server = express();
    this.expressPlugins = require("../plugins/express");
    this.pluginsLoaded = false;

    // Initialize our database helpers
    this.databasePlugins = {};
    this._databaseInitFlag = false;
    this.database = mongoose;

    // Initialize some building blocks for the app
    this.DS = null;
    this.controllers = [];
    this.scopes = {};

    this.token = new TokenLib(
      this._options.bearerTokenSignature,
      this._options.bearerTokenExpiry
    );

    this.testMode = this._options.testMode;
    return this;
  }

  // Manually set config options
  set(option, value) {
    this._options[option] = value;
    return this;
  }

  // Adds a controller to the API
  addController(controller) {
    this.controllers.push(controller);
    return this;
  }

  // Sets up the permission matrix
  addScopes(schema, options) {
    for (let p in options) {
      if (options.model) this._options.scopeCarrier.model = options.model;
      if (options.field) this._options.scopeCarrier.field = options.field;
      if (options.availableScopes)
        this._options.scopeCarrier.availableScopes = options.availableScopes;
    }

    this.scopes = schema;
    return this;
  }

  // Adds a Mongoose schema to our application
  addSchema(schema) {
    this.schema = schema;
    return this;
  }

  // Initializes the Phobos.DS object and returns it - useful for task runners
  async initDb() {
    if (!this.testMode) {
      if (this._databaseInitFlag) return this.DS;

      const gracefulExit = () => {
        this.database.connection.close(() => {
          console.log("=> MongoDB connection closed through SIGTERM");
          process.exit(0);
        });
      };

      const options = { server: {}, useMongoClient: true };

      process.on("SIGINT", gracefulExit).on("SIGTERM", gracefulExit);

      mongoose.connection.on("error", (err) => {
        console.error("!! Failed to connect to MongoDB", err);
        process.exit(0);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("=> MongoDB connection disconnected");
        process.exit(0);
      });
    }

    await this.database.connect(this._options.dbUri);

    this.DS = {};

    const Schemas =
      typeof this.schema === "function" ? this.schema(this.database) : {};

    for (let s in Schemas) {
      if (Schemas.hasOwnProperty(s))
        this.DS[s] = this.database.model(s, Schemas[s]);
    }

    this._databaseInitFlag = true;
    return this.DS;
  }

  // Simple way to include plugins into the app
  extend(name, func) {
    this[name] = func;
    return this;
  }

  // Internal function run when Phobos.start() is called
  prelaunchChecks() {
    if (this._options.bearerTokenSignature === null) {
      console.error(
        "!! Property `bearerTokenSignature` has not been defined and is required."
      );
      return false;
    }

    return true;
  }

  // This is the first piece of middleware in the app - used to attach important data to the req + res
  attach(req, res, next) {
    req.phobos = {};
    req.phobos.options = this._options;
    req.phobos.permissions = this.scopes;
    req.scopes = this.scopes;

    return next();
  }

  //
  initPlugins() {
    for (let n in this.expressPlugins) {
      this.server.use(
        this.expressPlugins[n].plugin(this.expressPlugins[n].opts)
      );
    }

    this.pluginsLoaded = true;
    return this;
  }

  // Launches the server
  start() {
    if (!this.prelaunchChecks()) return false;

    this._router = new PhobosRouter(this.server, this.DS, {});

    const options = this._options;
    this.server.use(this.attach.bind(this));

    if (!this.pluginsLoaded) this.initPlugins();

    for (let controller of this.controllers) {
      this._router.addController(controller);
    }

    this._router.mount();

    if (!this.testMode) {
      this.server.listen(options.port, () => {
        console.log(
          `=> ${options.appName} server running on port ${options.port}`
        );
      });
    }

    return this;
  }

  // Launches the error handler middleware into the stack
  mountErrorHandler(fn) {
    if (typeof fn === "function") return this.server.use(fn);
    if (typeof this._options.errorHandler === "function")
      return this.server.use(this._options.errorHandler);

    return;
  }
}

module.exports = Phobos;
