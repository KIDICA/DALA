const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({dest: "uploads/"});
const logger = require("./../../utils/logger");

function errorHandler(err, req, res) {
  logger.error(err);
  res.status(500).send({error: err});
}

router.post("/predict", upload.single("file"), function (req, res) {
  try {
    const file = req.file;
    const originFile = path.join(__dirname, "../../uploads", file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === ".jpg") {
      fs.readFile(originFile, (err, data) => {
        if (err) {
          return errorHandler(err, res);
        }
        req.api.predict(data)
          .then(result => {
            setTimeout(() => {
              fs.unlink(originFile, () => {/* ignore, delayed delete via OS is interpreted as error. */});
              res.send(result.predictions);
            }, 100);
          }).catch(error => errorHandler(error, res));
      });
    }
  } catch (e) {
    errorHandler(e.message, res);
  }
});

/** Submits the temp file to azure and then deletes it. */
router.post("/upload", upload.single("file"), function (req, res, next) {
  try {
    const file = req.file;
    logger.debug(file);
    const originFile = path.join(__dirname, "../../uploads", file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.join(__dirname, "../../uploads", file.filename + ext);
    logger.debug(originFile, ext, targetPath);
    if (ext === ".png" || ext === ".jpg") {
      fs.rename(originFile, targetPath, err => {
        if (err) {
          return errorHandler(err, res);
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
                  logger.error(err);
                }
              });

              const response = {
                id: image.id,
                created: image.created,
                imageUrl: image.originalImageUri,
                thumbnailUrl: image.thumbnailUri,
                tags: null
              };

              logger.debug("upload-complete", response);

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