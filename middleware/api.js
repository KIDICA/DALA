const AiApi = require("../api/azure");

// Async single threading is sexy...
var loadedApi = false;
var apiData = {};
const api = new AiApi();

module.exports = function (req, res, next) {
  console.log("api-middleware-loaded", loadedApi);
  req.api = api;

  if (!loadedApi) {
    api.load()
      .then(result => {
        apiData = result;
        req.apiData = result;
        loadedApi = true;
        next();
      })
      .catch(error => {
        console.error(error);
        next();
      });
  }

  req.apiData = apiData;
  next();
};