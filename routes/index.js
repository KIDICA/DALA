const express = require('express');
const router = express.Router();
const AiApp = require("../ai");
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const uuid = require('uuid');

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};

const aiApp = new AiApp();
var loaded = false;
var data = undefined;
var uploadCount = 0;

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

router.get('/', async function (req, res, next) {
  if (!loaded) {
    data = await aiApp.load();
    loaded = true;
  }
  res.render('index', {tags: data.tags, images: data.images});
});

router.get("/counts", function (req, res, next) {
  aiApp.getLabelCounts()
    .then(counts => {
      res.send(counts);
    });
});

router.get("/image/:id", function (req, res, next) {
  const imageId = req.params.id;

  aiApp.getImageById(imageId)
    .then(image => {
      res.send(image);
    })
});

router.post("/", function (req, res, next) {
  const data = req.body;
  console.log("tag-image", data);
  aiApp.tagImage(data)
    .then(response => {
      res.send(response);
    })
    .catch(error => console.log(error));
});

router.post("/upload", upload.single('file'), function (req, res, next) {
  const tempPath = req.file.path;
  const id = uuid.v1();
  const ext = path.extname(req.file.originalname).toLowerCase();
  const targetPath = path.join(__dirname, `./uploads/${id}.{ext}`);

  if (ext === ".png" || ext === ".jpg") {
    fs.rename(tempPath, targetPath, err => {
      if (err) {
        return handleError(err, res);
      }
      uploadCount += 1;
      res.send({uploadCount});
    });
  } else {
    fs.unlink(tempPath, err => {
      if (err) {
        return handleError(err, res);
      }

      res
        .status(403)
        .contentType("text/plain")
        .end("Only .png files are allowed!");
    });
  }
});

module.exports = router;
