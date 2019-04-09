const express = require("express");
const router = express.Router();

/*
aiApp.load()
  .then(function (data) {

    return;

    aiApp.predict(data, "test_od_image.jpg");
    return;
    azureData.upload(data)
      .then(function () {
        console.log("Upload completed...");
        // Delay until service updates, otherwise "not yet trained" error.
        setTimeout(() => {
          aiApp.train(data)
            .then(function (trainingIteration) {
              setTimeout(() => {
                aiApp.predict(data);
              });
            });
        }, 2000);
      });
  });

 */

router.get("/", function (req, res, next) {
  res.render("index", {tags: req.apiData.tags, images: req.apiData.images});
});

module.exports = router;
