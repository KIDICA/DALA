const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({dest: "uploads/"});

router.get("/counts", function (req, res, next) {
  req.api.getLabelCounts()
    .then(counts => {
      res.send(counts);
    });
});

router.get("/image/:id", function (req, res, next) {
  const imageId = req.params.id;

  req.api.getImageById(imageId)
    .then(image => {
      res.send(image);
    })
});

router.post("/", function (req, res, next) {
  const data = req.body;
  console.log("tag-image", data);
  req.api.tagImage(data)
    .then(response => {
      res.send(response);
    })
    .catch(error => console.log(error));
});

router.post("/upload", upload.single("file"), function (req, res, next) {
  try {
    const file = req.file;
    const originFile = path.join(__dirname, "../uploads", file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.join(__dirname, "../uploads", file.filename + ext);

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
            .then(result => {
              counts.uploads += 1;
              console.log("Upload-count", uploadCount);
              fs.unlink(targetPath, function (err) {
                if (err) {
                  console.error(err);
                }
              });
              res.send({uploadCount, result});
            })
            .catch(error => {
              console.error(error);
              handleError(error);
            });
        });
      });
    } else {
      fs.unlink(file, err => {
        if (err) {
          return handleError(err, res);
        }

        res
          .status(403)
          .contentType("application/json")
          .end("Only .png files are allowed!");
      });
    }
  } catch (e) {
    handleError(e.message, res);
  }
});

module.exports = router;