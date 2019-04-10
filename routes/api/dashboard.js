const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({dest: "uploads/"});

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', {error: err});
}

router.post("/upload", upload.single("file"), function (req, res, next) {
  try {
    const file = req.file;
    const originFile = path.join(__dirname, "../../uploads", file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.join(__dirname, "../../public/uploads", "predict" + ext);

    if (ext === ".png" || ext === ".jpg") {
      fs.rename(originFile, targetPath, err => {
        if (err) {
          return errorHandler(err, req, res, next);
        }

        fs.unlink(originFile, err => {
          // Try delete, still raised, although succeeds.
          //if (err) {
          //return handleError(err, res);
          //}

          // Upload file and delete temp file
          req.api.uploadFile({filepath: targetPath})
            .then(result => {
              req.api.predict("/public/uploads/predict" + ext)
                .then(response => res.send(response))
                .catch(error => errorHandler(error, req, res, next));
            })
            .catch(error => {
              throw new Error(error);
            });
        });
      });
    } else {
      fs.unlink(file, err => {
        if (err) {
          return errorHandler(err, req, res, next);
        }

        res
          .status(403)
          .contentType("application/json")
          .end("Only .png files are allowed!");
      });
    }
  } catch (e) {
    errorHandler(e.message, req, res, next);
  }
});

module.exports = router;