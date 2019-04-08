const fs = require('fs');
const util = require('util');
const TrainingApi = require("azure-cognitiveservices-customvision-training");
const PredictionApiClient = require("azure-cognitiveservices-customvision-prediction");
const setTimeoutPromise = util.promisify(setTimeout);

const config = require("./config");

// API credentials
const hemlockTag = "hemlock";
const cherryTag = "cherry";
const createTags = [hemlockTag, cherryTag];
const publishIterationName = "defaultClassify";

// Only one instance of API client required
const trainer = new TrainingApi.TrainingAPIClient(config.trainingKey, config.endPoint);
const predictor = new PredictionApiClient(config.predictionKey, config.endPoint);

/**
 * Loads baic data about the project.
 * @param {boolean} param.createTags
 * @returns {Promise<object>}
 */
function AiApp() {
  // Will be assigned once the promise is resolved.
  this.project = undefined;
}

/**
 * Test an image in the storage.
 * @param {string} image File name.
 * @returns {Promise<Promise<models.ImagePrediction>>}
 */
AiApp.prototype.predict = function (image = "test_image.jpg") {
  return new Promise((resolve, reject) => {
    const testFile = fs.readFileSync(`${config.sampleDataRoot}/Test/${image}`);

    predictor.classifyImageWithNoStore(this.project.id, publishIterationName, testFile)
      .then(results => resolve(results));
  });
};

/**
 * Test an image from an URL.
 * @param {string} imageUrl image location.
 * @returns {Promise<Promise<models.ImagePrediction>>}
 */
AiApp.prototype.predictUrl = function (imageUrl) {
  return new Promise((resolve, reject) => {
    predictor.classifyImageWithNoStore(this.project.id, publishIterationName, imageUrl)
      .then(results => resolve(results));
  });
};

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
AiApp.prototype.storeImageInProject = function (url) {
  return new Promise((resolve, reject) => {
    trainer.createImagesFromUrls(this.project.id, {images: [url]})
      .then(result => resolve(result));
  });
};

/**
 * Downloads an image from the customvision.ai storage.
 * @param {string} url
 * @returns {Promise<any>}
 */
AiApp.prototype.downloadImage = function (url) {
  return new Promise((resolve, reject) => {

  });
};

/**
 * @returns {Promise<{}>}
 */
AiApp.prototype.getLabelCounts = function (id) {
  return new Promise((resolve, reject) => {
    trainer.getTaggedImageCount(id || this.project.id)
      .then(taggedCount => {
        trainer.getUntaggedImageCount(id || this.project.id)
          .then(untaggedCount => {
            resolve({tagged: taggedCount, untagged: untaggedCount});
          })
          .catch(reject);
      })
      .catch(reject);
  });
};

/**
 * Load the azure, project, image and tag data.
 * @param {boolean} param.createTags Optionally creates the tags.
 * @returns {Promise<any>}
 */
AiApp.prototype.load = function (param = {}) {
  const that = this;

  return new Promise((resolve, reject) => {
    trainer.getProject(config.projectId)
      .then(project => {
        function complete() {
          Promise.all([
            trainer.getTags(project.id),
            trainer.getTaggedImages(project.id),
          ]).then(values => {
            const tags = values[0];
            const images = values[1];

            that.project = project;

            that.imageIds = images.map(image => image.id);
            that.images = images;

            that.tagIds = tags.map(tag => tag.id);
            that.tags = tags;
            that.tagDict = {};

            tags.forEach(tag => that.tagDict[tag.id] = tag.name);
            resolve({tags, project, images});
          });
        }

        if (!param || !param.createTags) {
          complete();
          return;
        }

        const tagLastIndex = createTags.length - 1;
        createTags.forEach((tag, index) => {
          trainer.createTag(project.id, tag)
            .then(tag => {
              if (index === tagLastIndex) {
                complete();
              }
            })
            .catch(error => {
              // ignore error, tag already exists...
              if (index === tagLastIndex) {
                complete();
              }
            });
        });

      })
      .catch(error => {
        reject(error.message);
      });
  });
};

/**
 *
 * @param id
 * @returns {Promise<any>}
 */
AiApp.prototype.getImageById = function (id) {
  return new Promise((resolve, reject) => {
    trainer.getImagesByIds(this.project.id, {imageIds: [id]})
      .then(result => resolve(result))
      .catch(reject);
  });
};

/**
 * @param {object} project
 * @param {string} dir
 * @param {string} tagId
 * @param {function} done
 */
AiApp.prototype.uploadDir = function (dir, tagId) {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(dir);
    const lastIndex = files.length - 1;

    files.forEach((file, index) => {
      console.log(`Uploading ${file}`);
      setTimeout(async () => {
        try {
          await trainer.createImagesFromData(this.project.id, fs.readFileSync(`${dir}/${file}`), {tagIds: [tagId]});
        } catch (e) {
          console.error(e.message);
        }
        const progress = `${index + 1} / ${lastIndex}`;
        console.log(`Upload: ${progress}`);
        if (index === lastIndex) {
          console.info("Directory uploaded.");
          resolve();
        }
      }, 250);
    });
  });
};

/**
 * Updates/Creates and images tag.
 *
 * There is no "updateTag" API call, so first remove and then assign
 * an tag to an image.
 *
 * @param {ImageTagCreateEntry} tagData
 * @returns {Promise<ImageTagCreateSummary>}
 */
AiApp.prototype.tagImage = function (tagData) {
  return new Promise((resolve, reject) => {
    trainer.deleteImageTags(this.project.id, [tagData.imageId], this.tagIds)
      .then(result => {
        trainer.createImageTags(this.project.id, {tags: [tagData]})
          .then(taggingResult => {
            console.log(taggingResult);
            taggingResult.tags = taggingResult.created.map(tag => this.tagDict[tag.tagId]);
            resolve(taggingResult)
          });
      });
  })
};

/**
 * @returns {Promise<any>}
 */
AiApp.prototype.removeTagsFromImages = function () {
  return new Promise((resolve, reject) => {
    trainer.deleteImageTags(this.project.id, this.imageIds, this.tagIds)
      .then(result => resolve(result));
  });
};

/**
 * Upload files.
 * @param data
 * @returns {Promise<>}
 */
AiApp.prototype.upload = function (dir, tag) {
  return new Promise((resolve, reject) => {
    const hemlockDir = `${config.sampleDataRoot}/Hemlock`;
    const hemlockTagId = this.tags[hemlockTag].id;

    this.uploadDir(hemlockDir, hemlockTagId)
      .then(function () {
        const cherryDir = `${config.sampleDataRoot}/Japanese Cherry`;
        const cherryTagId = this.tags[cherryTag].id;

        this.uploadDir(cherryDir, cherryTagId)
          .then(function () {
            resolve();
          })
      });
  });
};

/**
 * @returns {Promise<Promise<models.Iteration>>}
 */
AiApp.prototype.train = async function () {
  return new Promise(async (resolve, reject) => {
    let trainingIteration = await trainer.trainProject(this.project.id);

    console.log("Training started...");
    while (trainingIteration.status === "Training") {
      console.log("Training status: " + trainingIteration.status);
      await setTimeoutPromise(1000, null);
      trainingIteration = await trainer.getIteration(this.project.id, trainingIteration.id)
    }

    console.log("Training status: " + trainingIteration.status);
    trainingIteration.isDefault = true;
    await trainer.updateIteration(this.project.id, trainingIteration.id, trainingIteration);

    // Publish the iteration to the end point
    await trainer.publishIteration(this.project.id, trainingIteration.id, publishIterationName, config.predictionResourceId);

    resolve(trainingIteration);
  });
};

/**
 * @param data
 * @returns {Promise<any>}
 */
AiApp.prototype.latestIteration = function (data) {
  return new Promise((resolve, reject) => {
    trainer.getIterations(this.project.id)
      .then(function (iterations) {
        const latestIteration = iterations.sort(function (a, b) {
          return new Date(b.trainedAt) - new Date(a.trainedAt);
        })[0];

        resolve(latestIteration);
      });
  });
};

module.exports = AiApp;

/*
// First launch, upload and tag data + train
app()
  .then(function (data) {
    console.log(express);
    return;

    predict(data, "test_od_image.jpg");
    return;
    this.upload()
      .then(function () {
        console.log("Upload completed...");
        // Delay until service updates, otherwise "not yet trained" error.
        setTimeout(() => {
          this.train()
            .then(function (trainingIteration) {
              setTimeout(() => {
                predict(data);
              });
            });
        }, 2000);
      });
  });
 */