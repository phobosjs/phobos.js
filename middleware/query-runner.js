"use strict";

module.exports = {
  inject: ["DS"],

  middleware: function queryRunnerMiddleware(DS) {
    return function queryRunner(req, res, next) {
      const Model = DS[req.controller.model];
      req.rawResources = {};

      let query = null;
      let count = null;

      if (req.params.id) {
        query = Model.findById(req.params.id);

        if (req.method === "GET") {
          query = query.lean(
            req.controller.spec ? req.controller.spec.leanQuery : true
          );
        }
      } else if (!req.params.id && req.method === "GET") {
        query = Model.find(req.searchParams);
        count = Model.countDocuments(req.searchParams);

        if (req.query.page) {
          const perPage = Number(req.query.perPage || 20);
          query = query
            .skip(Number(req.query.page) * perPage - perPage)
            .limit(perPage);
        } else {
          query = query.limit(Number(req.query.limit || 20));
        }

        if (req.query.order) query = query.sort(req.query.order);
        if (req.query.sort) query = query.sort(req.query.sort);

        query = query.lean(
          req.controller.spec ? req.controller.spec.leanQuery : true
        );
      } else {
        return next();
      }

      if (
        req.includeRelations &&
        Object.keys(req.includeRelations).length > 0
      ) {
        for (const r in req.includeRelations) {
          const relation = req.includeRelations[r];
          query = query.populate(relation.field);
        }
      }

      query
        .exec()
        .then((result) => {
          req.rawResources = result;

          if (!count) return next();

          return count.exec().then((counter) => {
            req.rawResourcesCount = counter;
            return next();
          });
        })
        .catch((err) => next(err));
    };
  },
};
