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

router.post("/upload", upload.single("file"), function (req, res, next) {
  try {
    const tempFile = req.file;
    const originFile = path.join(__dirname, "../../uploads", tempFile.filename);
    const ext = path.extname(req.file.originalname).toLowerCase();
    fs.mkdirSync(__dirname + "../../public/uploads", {recursive: true});
    const targetPath = path.join(__dirname, "../../public/uploads", "predict" + ext);

    if (ext === ".png" || ext === ".jpg") {
      fs.rename(originFile, targetPath, err => {
        if (err) {
          return errorHandler(err, req, res, next);
        }
        res.send({});
      });
    } else {
      fs.unlink(tempFile, console.debug);
    }
  } catch (e) {
    errorHandler(e.message, req, res, next);
  }
});

module.exports = router;