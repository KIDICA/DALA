const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({dest: "uploads/"});

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).send({error: err});
}

router.post("/", function (req, res, next) {
  const data = req.body;
  console.log("tag-image", data);
  req.api.tagImage(data)
    .then(response => {
      res.send(response);
    })
    .catch(error => console.log(error));
});

router.get("/predict/file", function (req, res, next) {
  req.api.predict("/public/uploads/" + req.params.file)
    .then(response => res.send(response))
    .catch(error => errorHandler(error, req, res, next));
});

/** Submits the temp file to azure and then deletes it. */
router.post("/upload", upload.single("file"), function (req, res, next) {
  try {
    const file = req.file;
    console.debug(file);
    const originFile = path.join(__dirname, "../../uploads", file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.join(__dirname, "../../uploads", file.filename + ext);
    console.debug(originFile, ext, targetPath);
    if (ext === ".png" || ext === ".jpg") {
      fs.rename(originFile, targetPath, err => {
        if (err) {
          return handleError(err, res);
        }

        fs.unlink(originFile, err => {
          // Try delete, still raised, although succeeds.
          //if (err) {
          //return handleError(err, res);
          //}

          // Upload file and delete temp file
          req.api.uploadFile({filepath: targetPath})
            .then(image => {
              fs.unlink(targetPath, function (err) {
                if (err) {
                  console.error(err);
                }
              });

              const response = {
                id: image.id,
                created: image.created,
                imageUrl: image.originalImageUri,
                thumbnailUrl: image.thumbnailUri,
                tags: null
              };

              console.debug("upload-complete", response);

              res.send(response);
            })
            .catch(error => {
              errorHandler(error);
            });
        });
      });
    } else {
      fs.unlink(file, err => {
        if (err) {
          return errorHandler(err, res);
        }

        res
          .status(403)
          .contentType("application/json")
          .end("Only .png files are allowed!");
      });
    }
  } catch (e) {
    errorHandler(e.message, res);
  }
});

module.exports = router;