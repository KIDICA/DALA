const ApiBuilder = require("../api/azure");

var api = undefined;

module.exports = function (req, res, next) {
  if (!api) {
    ApiBuilder.create()
      .then(instance => {
        api = instance;
        req.api = instance;
        next();
      })
      .catch(error => {
        console.error(error);
        next();
      });
  } else {
    req.api = api;
    next();
  }
};