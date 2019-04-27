const fs = require('fs');
const util = require('util');
const TrainingApi = require("azure-cognitiveservices-customvision-training/lib/trainingAPIClient");
const PredictionApiClient = require("azure-cognitiveservices-customvision-prediction/lib/predictionAPIClient");
const setTimeoutPromise = util.promisify(setTimeout);
const path = require("path");

const config = require("../config.json");

// API credentials
const hemlockTag = "hemlock";
const cherryTag = "cherry";
const createTags = [hemlockTag, cherryTag];
const publishIterationName = "defaultClassify";

// Only one instance of API client required
const trainer = new TrainingApi.TrainingAPIClient(config.trainingKey, config.endPoint);
const predictor = new PredictionApiClient(config.predictionKey, config.endPoint);

/**
 * Allow CRUD and Upload of images for AI related tasks.
 * Builds on top of the Azure Trainer and Predictor API.
 *
 * @param {Boolean} param.createTags
 * @returns {Promise<object>}
 * @author srad
 */
function AiApi() {
  // Will be assigned once the promise is resolved.
  this.project = undefined;
}

/**
 * @param {string} [projectId]
 * @returns {Promise<Project>}
 */
AiApi.prototype.init = function (projectId) {
  return new Promise((resolve, reject) => {
    trainer.getProject(projectId || config.projectId)
      .then(project => {
        this.project = project;
        resolve(this);
      })
      .catch(reject);
  });
};

/**
 * The path to the image relative to the root folder.
 *
 * @param {Buffer} file File name.
 * @returns {Promise<ImagePrediction>}
 */
AiApi.prototype.predict = function (file) {
  return new Promise((resolve, reject) => {
    console.debug("api-predict");
    predictor.classifyImageWithNoStore(this.project.id, publishIterationName, file)
      .then(results => resolve(results))
      .catch(error => reject(error));
  });
};

/**
 * Test an image from an URL.
 *
 * @param {string} imageUrl image location.
 * @returns {Promise<Promise<models.ImagePrediction>>}
 * @example
 * { id: 'b940efda-39cb-43ad-8d16-bc1c18c7c009',
  project: '03e2fdff-590f-4b0c-8079-851ad8016eee',
  iteration: 'f8fb9d35-5277-407f-a62b-1301b29e7a34',
  created: 2019-04-12T10:55:37.143Z,
  predictions:
   [ { probability: 1,
       tagId: '514b39fc-2226-4d47-a02c-1854c4516270',
       tagName: 'hemlock' },
     { probability: 7.83467126e-31,
       tagId: '165b4a92-ca8c-45e0-9a02-c58aad2a60f6',
       tagName: 'cherry' } ] }
 */
AiApi.prototype.predictUrl = function (imageUrl) {
  return new Promise((resolve, reject) => {
    console.debug("api-predictUrl", imageUrl);
    predictor.classifyImageUrlWithNoStore(this.project.id, publishIterationName, imageUrl)
      .then(results => resolve(results))
      .catch(error => reject(error));
  });
};

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
AiApi.prototype.storeImageInProject = function (url) {
  return new Promise((resolve, reject) => {
    trainer.createImagesFromUrls(this.project.id, {images: [url]})
      .then(result => resolve(result));
  });
};

/**
 * Downloads an image from the customvision.ai storage.
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
AiApi.prototype.downloadImage = function (url) {
  return new Promise((resolve, reject) => {

  });
};

/**
 * @returns {Promise<{}>}
 */
AiApi.prototype.getLabelCounts = function () {
  return new Promise((resolve, reject) => {
    Promise.all([
      trainer.getTaggedImageCount(this.project.id),
      trainer.getUntaggedImageCount(this.project.id),
    ]).then(values => resolve({tagged: values[0], untagged: values[1]}))
      .catch(reject);
  });
};

AiApi.prototype.getTaggedCount = function () {
  return new Promise((resolve, reject) => {
    trainer.getTaggedImageCount(this.project.id)
      .then(resolve)
      .catch(reject);
  });
};

AiApi.prototype.getUntaggedCount = function () {
  return new Promise((resolve, reject) => {
    trainer.getUntaggedImageCount(this.project.id)
      .then(resolve)
      .catch(reject);
  });
};

AiApi.prototype.getTags = function (options) {
  return new Promise((resolve, reject) => {
    trainer.getTags(this.project.id, options)
      .then(resolve)
      .catch(reject);
  });
};

/**
 * Load the azure, image and tag data with pagination.
 *
 * @param param.take {number} [take]
 * @param param.skip {number} [skip]
 * @param {boolean} param.createTags Optionally creates the tags.
 * @returns {Promise<any>}
 */
AiApi.prototype.load = function (param = {take: 10, skip: 0, createTags: false}) {
  return new Promise((resolve, reject) => {
    const complete = () => {
      Promise.all([
        trainer.getTags(this.project.id),
        trainer.getTaggedImages(this.project.id, {take: param.take, skip: param.skip}),
      ]).then(values => {
        resolve({tags: values[0], project: this.project, images: values[1]});
      }).catch(reject);
    };

    if (!param.createTags) {
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
  });
};

/**
 * Arguments are delegated, this is only an abstraction layer.
 * @param param
 * @returns {Promise<any>}
 */
AiApi.prototype.getTaggedImages = function (param) {
  return new Promise((resolve, reject) => {
    trainer.getTaggedImages(this.project.id, param)
      .then(result => resolve(result))
      .catch(reject);
  });
};

AiApi.prototype.getUntaggedImages = function (param) {
  return new Promise((resolve, reject) => {
    trainer.getUntaggedImages(this.project.id, param)
      .then(result => resolve(result))
      .catch(reject);
  });
};

/**
 *
 * @param {string} id
 * @returns {Promise<any>}
 */
AiApi.prototype.getImageById = function (id) {
  return new Promise((resolve, reject) => {
    trainer.getImagesByIds(this.project.id, {imageIds: [id]})
      .then(result => resolve(result)[0])
      .catch(reject);
  });
};

/**
 * @param {Object} param
 * @param {String} param.filepath
 * @param {String[]} [param.tags] Tag ids.
 * @returns {Promise<any>}
 */
AiApi.prototype.uploadFile = function (param) {
  return new Promise((resolve, reject) => {
    console.log("upload-file", param);
    fs.readFile(param.filepath, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      trainer.createImagesFromData(this.project.id, data, {tagIds: param.tags || []})
        .then(result => resolve(result))
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @param {string} dir
 * @param {string} tagId
 * @returns {Promise<>}
 */
AiApi.prototype.uploadDir = function (dir, tagId) {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(dir);
    const lastIndex = files.length - 1;

    files.forEach((file, index) => {
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
AiApi.prototype.tagImage = function (tagData) {
  return new Promise((resolve, reject) => {
    this.getTags()
      .then(tags => {
        const tagIds = tags.map(tag => tag.id);
        console.debug("delete-tags", tagIds);
        trainer.deleteImageTags(this.project.id, [tagData.imageId], tagIds)
          .then(result => {
            trainer.createImageTags(this.project.id, {tags: [tagData]})
              .then(taggingResult => {
                resolve(taggingResult);
              }).catch(reject);
          }).catch(reject);
      });
  })
};

/**
 * @returns {Promise<any>}
 */
AiApi.prototype.removeTagsFromImages = function () {
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
AiApi.prototype.upload = function (dir, tag) {
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
 * @param {function} status
 * @returns {Promise<Promise<models.Iteration>>}
 */
AiApi.prototype.train = async function (status) {
  return new Promise(async (resolve, reject) => {
    try {
      let trainingIteration = await trainer.trainProject(this.project.id);

      console.debug("Training started...");
      while (trainingIteration.status === "Training") {
        console.debug("Training status: " + trainingIteration.status);
        await setTimeoutPromise(1000, null);
        trainingIteration = await trainer.getIteration(this.project.id, trainingIteration.id)
      }

      if (typeof status === 'function') {
        status(trainingIteration);
      }
      console.debug("Training status: " + trainingIteration.status);
      trainingIteration.isDefault = true;
      await trainer.updateIteration(this.project.id, trainingIteration.id, trainingIteration);

      // Publish the iteration to the end point
      trainer.publishIteration(this.project.id, trainingIteration.id, publishIterationName, config.predictionResourceId)
        .then(r => resolve(trainingIteration))
        .catch(reject);
    } catch (e) {
      reject(e.message);
    }
  });
};

/**
 * @param {string[]|string} imageIds
 * @returns {Promise<void>}
 */
AiApi.prototype.deleteImages = function (imageIds) {
  if (imageIds && !Array.isArray(imageIds)) {
    imageIds = [imageIds];
  }
  return new Promise((resolve, reject) => {
    trainer.deleteImages(this.project.id, imageIds)
      .then(response => resolve(response))
      .catch(error => reject(error))
  });
};

/**
 * @returns {Promise<number>}
 */
AiApi.prototype.getIterationCount = function () {
  return new Promise((resolve, reject) => {
    trainer.getIterations(this.project.id)
      .then(r => {
        return resolve(r.length);
      })
      .catch(error => reject(error));
  });
};

/**
 * @param data
 * @returns {Promise<any>}
 */
AiApi.prototype.getIterations = function () {
  return new Promise((resolve, reject) => {
    trainer.getIterations(this.project.id)
      .then(r => {
        return resolve(r);
      })
      .catch(error => reject(error));
  });
};

/**
 * Don't use await, it's broken and yields to weird results.
 * @param {Buffer} file
 * @returns {Promise<any>}
 */
AiApi.prototype.getPredictionHistory = function (file) {
  return new Promise(async (resolve, reject) => {
    this.getIterations()
      .then(its => {
        if (its.length === 0) {
          return reject("No iterations yet");
        }
        const retainOrder = its.map(it => it.id);
        const results = new Array(its.length);
        let count = its.length;

        its.forEach(async (it, index) => {
          setTimeout(() => {
            // Prevents API blocking due to DoS
            trainer.quickTestImage(this.project.id, file, {iterationId: it.id})
              .then(result => {
                const correctIndex = retainOrder.indexOf(result.iteration);
                results.splice(correctIndex, 0, result);
                count -= 1;
                if (count === 0) {
                  resolve(results);
                }
              }).catch(error => reject(error));
          }, 250);
        });
      }).catch(error => {
      console.error(error);
      reject(error);
    });
  });
};

/**
 * @type {{create: (function(): Promise<Project>)}}
 */
const AiBuilder = {
  /**
   * @param {string} [projectId] Either the project-id from the config.json will be used
   * or one can be provided. This is useful for multi-project projects.
   * @returns {Promise<AiApi>}
   */
  create: function (projectId) {
    return new Promise((resolve, reject) => {
      (new AiApi())
        .init(projectId)
        .then(resolve)
        .catch(reject)
    });
  }
};

module.exports = AiBuilder;

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