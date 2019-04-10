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
  res.render("index", {
    tags: req.apiData.tags,
    images: req.apiData.images,
    //language=HTML
    toolbar: `
      <div class="btn-group float-right" role="group">
        <button type="button" class="btn btn-primary mr-1">Labeled (<span id="tagged"></span>)</button>
        <button type="button" class="btn btn-secondary mr-1">Unlabeled (<span id="untagged"></span>)</button>
      </div>
    `
  });
});

module.exports = router;
