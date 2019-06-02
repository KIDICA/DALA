const fs = require("fs");
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);
const logger = require("../utils/logger");

const config = require("../config/config.json");

const TrainingApi = require("@azure/cognitiveservices-customvision-training");
const PredictionApiClient = require("@azure/cognitiveservices-customvision-prediction");

// Only one instance of API client required, the argument for these functions
// are anyways passed in stateless like HTTP requests.
const tr = new TrainingApi.TrainingAPIClient(config.trainingKey, config.endPoint);
const pred = new PredictionApiClient.PredictionAPIClient(config.predictionKey, config.endPoint);

/**
 * All API queries will first be queue and executed after an certain interval
 * to prevent API blocking due to heavy successive calls.
 * @type {[{Function}]} Global management, this is not instance bound.
 * */
const apiQueue = [];

/**
 * Maximum of 10 API calls/s, but it but the endpoint gets iffy often earlier, so leave some room.
 * @see https://docs.microsoft.com/de-de/azure/cognitive-services/custom-vision-service/limits-and-quotas
 * @type {number}
 */
const dequeueInterval = 130;

const time = require("../utils/time");

setInterval(() => {
  if (apiQueue.length > 0) {
    const callback = apiQueue.shift();
    callback(tr, pred);
  }
}, dequeueInterval);

/**
 * This a general API abstraction over whatever will communicate
 * with the application AI service needs.
 * Use the init to create an instance.
 * @constructor
 * @author srad
 */
function Azure() {
  /** @type {Project} Will be assigned once the promise is resolved. */
  this.project = undefined;
  /** @type {String[]} Retains published iteration names. */
  this.published = [];
  /** @type {Iteration[]} Currently published Azure iterations. New ones will be added when {@link Azure#train} is called. */
  this.iterations = [];
  /** @type {Number} The API allows a fixed number of training iterations. If we want to add new ones, we need to delete the old ones. */
  this.maxIterationCount = 10;
  /** @type {Tag[]} */
  this.tags = [];
}

/**
 * True when currently a training is in progress.
 * @static
 * @type {boolean}
 */
Azure.isTraining = false;

/**
 * @param {Function} callback
 */
function enqueue(callback) {
  apiQueue.push(callback);
}

/**
 * Published trainings need to have UNIQUE names in Azure CustomVision API.
 * This function creates uniform collision-free names.
 * @returns {string}
 */
Azure.prototype.createPublishName = function() {
  const name = "IterationPub_" + time.now();
  this.published.push(name);
  return name;
};

/**
 * @returns {string}
 */
Azure.prototype.lastPublish = function() {
  return this.iterations[this.iterations.length - 1].publishName;
};

/**
 * @returns {Iteration}
 */
Azure.prototype.lastIteration = function() {
  return this.iterations[this.iterations.length - 1];
};

/**
 * @param {string} [projectId] Optional, if not given then it's taken from the config.json.
 * @returns {Promise<Azure>}
 */
Azure.prototype.init = function(projectId) {
  return new Promise((resolve, reject) => {
    const id = projectId || config.projectId;

    enqueue(trainer => {
      Promise.all([
        trainer.getProject(id),
        trainer.getIterations(id),
        trainer.getTags(id),
      ]).then(values => {
        const project = values[0];
        // Order from old to new.
        const iterations = values[1].sort((it1, it2) => it1.created - it2.created);
        this.iterations = iterations; // May be empty if nothing trained yet.
        this.project = project;
        this.tags = values[2];

        resolve(this);
      }).catch(error => {
        logger.error(error);
        reject(error);
      });
    });
  });
};

/**
 * The path to the image relative to the root folder.
 *
 * @param {Buffer} file File name.
 * @returns {Promise<ImagePrediction>}
 */
Azure.prototype.predict = function(file) {
  return new Promise((resolve, reject) => {
    enqueue((trainer, predictor) => {
      predictor.classifyImageWithNoStore(this.project.id, this.lastPublish(), file)
        .then(results => resolve(results))
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * Test an image from an URL.
 *
 * @param {string} imageUrl image location.
 * @returns {Promise<Promise<ImagePrediction>>}
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
Azure.prototype.predictUrl = function(imageUrl) {
  return new Promise((resolve, reject) => {
    if (this.iterations.length === 0) {
      reject("Nothing trained yet");
      return;
    }

    enqueue((trainer, predictor) => {
      // TODO: Ask MS whats the difference between quicktest and classify.
      predictor.classifyImageUrlWithNoStore(this.project.id, this.lastPublish(), imageUrl)
        //trainer.quickTestImageUrl(this.project.id, imageUrl, {iterationId: this.iterations[this.iterations.length - 1].id})
        .then(results => {
          logger.success({prefix: "azure", suffix: "(api-predictUrl)", message: imageUrl});
          resolve(results);
        })
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @param {String} url
 * @returns {Promise<ImageCreateSummary>}
 */
Azure.prototype.storeImageInProject = function(url) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.createImagesFromUrls(this.project.id, {images: [url]})
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  });
};

/**
 /**
 * @returns {Promise<{tagged: Number, untagged: Number}>}
 */
Azure.prototype.getLabelCounts = function() {
  return new Promise((resolve, reject) => {

    enqueue(trainer => {
      Promise.all([
        trainer.getTaggedImageCount(this.project.id),
        trainer.getUntaggedImageCount(this.project.id),
      ]).then(values => resolve({tagged: values[0].body, untagged: values[1].body}))
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @param options
 * @returns {Promise<Tag[]>}
 */
Azure.prototype.getTags = function(options) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getTags(this.project.id, options)
        .then(tags => {
          logger.success({prefix: "azure", message: tags});
          resolve(tags);
        })
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * Load the azure, image and tag data with pagination.
 *
 * @param param.take {Number} [take]
 * @param param.skip {Number} [skip]
 * @returns {Promise<{tags: Tag[], project: Project, images: Image[]}>}
 */
Azure.prototype.load = function(param = {take: 10, skip: 0}) {
  return new Promise((resolve, reject) => {

    enqueue(trainer => {
      Promise.all([
        trainer.getTags(this.project.id),
        trainer.getTaggedImages(this.project.id, {take: param.take, skip: param.skip}),
      ]).then(values => {
        resolve({tags: values[0], project: this.project, images: values[1]});
      }).catch(error => {
        logger.error(error);
        reject(error);
      });
    });
  });
};

/**
 * Arguments are delegated, this is only an abstraction layer.
 * @param {Object} param
 * @returns {Promise<Image[]>}
 */
Azure.prototype.getTaggedImages = function(param) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getTaggedImages(this.project.id, param)
        .then(result => resolve(result))
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 *
 * @param {Object} param
 * @returns {Promise<Image[]>}
 */
Azure.prototype.getUntaggedImages = function(param) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getUntaggedImages(this.project.id, param)
        .then(result => resolve(result))
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 *
 * @param {string} id
 * @returns {Promise<any>}
 */
Azure.prototype.getImageById = function(id) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getImagesByIds(this.project.id, {imageIds: [id]})
        .then(result => resolve(result)[0])
        .catch(reject);
    });
  });
};

/**
 * @returns {Tag}
 */
Azure.prototype.voidTag = function() {
  return this.tags.filter(tag => tag.name === "void")[0];
};

/**
 * @param {Object} param
 * @param {String} param.filepath
 * @param {String[]} [param.tags] Tag ids.
 * @returns {Promise<any>}
 */
Azure.prototype.uploadFile = function(param) {
  return new Promise((resolve, reject) => {
    logger.debug("upload-file", param);
    fs.readFile(param.filepath, (err, data) => {
      if (err) {
        logger.error(err);
        reject(err);
        return;
      }
      enqueue(trainer => {
        trainer.createImagesFromData(this.project.id, data, {tagIds: param.tags || []})
          .then(result => {
            logger.success({prefix: "azure", message: result, suffix: "(createImagesFromData)"});
            logger.success({prefix: "azure", message: result.images[0].image, suffix: "createImagesFromData"});
            resolve(result.images[0].image);
          })
          .catch(error => {
            logger.error({prefix: "azure", message: error});
            reject(error);
          });
      });
    });
  });
};

/**
 * @param {String} dir
 * @param {String} tagId
 * @returns {Promise<>}
 */
Azure.prototype.uploadDir = function(dir, tagId) {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(dir);
    const lastIndex = files.length - 1;

    files.forEach((file, index) => {
      setTimeout(async () => {
        try {
          enqueue(async trainer => {
            await trainer.createImagesFromData(this.project.id, fs.readFileSync(`${dir}/${file}`), {tagIds: [tagId]});
          });
        } catch (e) {
          logger.error(e.message);
        }
        const progress = `${index + 1} / ${lastIndex}`;
        logger.debug(`Upload: ${progress}`);
        if (index === lastIndex) {
          logger.debug("Directory uploaded.");
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
Azure.prototype.tagImage = function(tagData) {
  return new Promise((resolve, reject) => {
    this.getTags()
      .then(tags => {
        const tagIds = tags.map(tag => tag.id);
        logger.success({suffix: "(delete-tags)", message: tagIds, prefix: "azure"});

        enqueue(trainer => {
          trainer.deleteImageTags(this.project.id, [tagData.imageId], tagIds)
            .then(result => {
              trainer.createImageTags(this.project.id, {tags: [tagData]})
                .then(taggingResult => {
                  resolve(taggingResult);
                })
                .catch(error => {
                  logger.error(error);
                  reject(error);
                });
            })
            .catch(error => {
              logger.error(error);
              reject(error);
            });
        });
      });
  });
};

/**
 * @param {String[]} imageId
 * @returns {Promise<void>}
 */
Azure.prototype.deleteImageTags = function(imageIds) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getTags(this.project.id)
        .then(tags => {
          trainer.deleteImageTags(this.project.id, imageIds, tags.map(tag => tag.id))
            .then(resolve)
            .catch(reject);
        }).catch(reject);
    });
  });
};

/**
 * We don't reject unpublish or delete of iterations, stupidly the API thinks
 * i f something is already unpublished it needs to panic.
 * @param {Iteration} it
 * @returns {Promise<Iteration>}
 */
Azure.prototype.deleteIteration = function(it) {
  return new Promise((resolve, reject) => {
    logger.debug({suffix: "un-publish-iteration", prefix: "azure", message: it});

    enqueue(trainer => {
      trainer.unpublishIteration(this.project.id, it.id)
        .then(() => {
          trainer.deleteIteration(this.project.id, it.id)
            .then(() => {
              resolve(it);
            }).catch(error => {
            logger.error(error);
            reject(error);
          });
        });
    });
  });
};

/**
 * @param {Function} [status] Callback for progress updates.
 * @returns {Promise<Iteration>}
 */
Azure.prototype.train = async function(status) {
  return new Promise(async (resolve, reject) => {
    try {
      if (Azure.isTraining) {
        reject("Training already in progress");
        return;
      }
      this.getIterations()
        .then(its => {
          const exceededIterations = its.length >= this.maxIterationCount;
          if (exceededIterations) {
            logger.debug(`Maximum number of iterations exceeded ${its.length}/${this.maxIterationCount}`);
            this.deleteIteration(its[0])
              .then(() => {
                this.startTraining(status)
                  .then(iteration => resolve(iteration))
                  .catch(error => reject(error));
              }).catch(error => reject(error));
          } else {
            this.startTraining(status)
              .then(iteration => resolve(iteration))
              .catch(error => reject(error));
          }
        })
        .catch(error => logger.error(error));
    } catch (e) {
      logger.error(e.message);
      reject(e.message);
    }
  });
};

/**
 * @param {Function} [status]
 * @returns {Promise<Iteration>}
 */
Azure.prototype.startTraining = function(status) {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      Azure.isTraining = true;
      trainer.trainProject(this.project.id)
        .then(async trainingIteration => {
          logger.debug("Training started...");

          // Only await block
          while (trainingIteration.status === "Training") {
            logger.debug("Training status: " + trainingIteration.status);
            // Block and wait until checking again.
            await setTimeoutPromise(1500, null);
            trainingIteration = await trainer.getIteration(this.project.id, trainingIteration.id);
          }
          Azure.isTraining = false;

          if (typeof status === "function") {
            status(trainingIteration);
          }

          logger.debug("Training status: " + trainingIteration.status);
          trainingIteration.isDefault = true;
          logger.debug("Training-iteration: ", trainingIteration);
          trainer.updateIteration(this.project.id, trainingIteration.id, trainingIteration)
            .then(() => {
              const newName = this.createPublishName();
              logger.debug("publishing iteration", newName);
              trainer.publishIteration(this.project.id, trainingIteration.id, newName, config.predictionResourceId)
                .then(it => {
                  this.getIterations()
                    .then(its => {
                      this.iterations = its;
                      resolve(trainingIteration);
                      Azure.isTraining = false;
                    }).catch(error => reject(error));
                })
                .catch(error => {
                  Azure.isTraining = false;
                  logger.error(error);
                  reject(error);
                });
            })
            .catch(error => {
              Azure.isTraining = false;
              logger.error(error);
              reject(error);
            });
        })
        .catch(error => {
          Azure.isTraining = false;
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @param {string[]|string} imageIds
 * @returns {Promise<void>}
 */
Azure.prototype.deleteImages = function(imageIds) {
  // Ensure Array.
  if (imageIds && !Array.isArray(imageIds)) {
    imageIds = [imageIds];
  }
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.deleteImages(this.project.id, imageIds)
        .then(response => resolve(response))
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @returns {Promise<IterationPerformance>}
 */
Azure.prototype.getPerformance = function() {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      if (this.iterations.length > 0) {
        trainer.getIterationPerformance(this.project.id, this.lastIteration().id)
          .then(result => resolve(result))
          .catch(error => reject(error));
      } else {
        reject("No performance data yet");
      }
    });
  });
};

/**
 * @returns {Promise<Number>}
 */
Azure.prototype.getIterationCount = function() {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getIterations(this.project.id)
        .then(its => {
          resolve(its.length);
        })
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * @param data
 * @returns {Promise<Iteration[]>}
 */
Azure.prototype.getIterations = function() {
  return new Promise((resolve, reject) => {
    enqueue(trainer => {
      trainer.getIterations(this.project.id)
        .then(its => {
          logger.debug("Iterations: ", its);
          // old to new.
          resolve(its.sort((it1, it2) => it1.created - it2.created));
        })
        .catch(error => {
          logger.error(error);
          reject(error);
        });
    });
  });
};

/**
 * Don't use await, it's broken and yields to weird results.
 * @param {Buffer} file
 * @returns {Promise<ImagePrediction[]>}
 */
Azure.prototype.getPredictionHistory = function(file) {
  return new Promise(async (resolve, reject) => {
    this.getIterations()
      .then(its => {
        if (its.length === 0) {
          return reject("No iterations yet");
        }

        // The promises can return out of order.
        const retainOrder = its.map(it => it.id);
        const results = [];
        let count = its.length;

        its.forEach(it => {
          enqueue(trainer => {
            // Prevents API blocking due to DoS
            trainer.quickTestImage(this.project.id, file, {iterationId: it.id})
              //predictor.classifyImageWithNoStore(this.project.id, this.iterations[this.iterations.length - 1].createPublishName, file)
              .then(prediction => {
                const correctIndex = retainOrder.indexOf(prediction.iteration);
                prediction.index = correctIndex;
                results.push(prediction);

                count -= 1;
                if (count === 0) {
                  resolve(results.sort((p1, p2) => p1.index - p2.index));
                }
              })
              .catch(error => {
                logger.error(error);
                reject(error);
              });
          });
        });
      })
      .catch(error => {
        logger.error(error);
        reject(error);
      });
  });
};

/**
 * Only public function.
 * @type {{create: (function(string=): Promise<Azure>)}}
 */
const Builder = {
  /**
   * @param {string} [projectId] Either the project-id from the config.json will be used
   * or one can be provided. This is useful for multi-project apps.
   * @returns {Promise<Azure>}
   */
  create: function(projectId) {
    return new Promise((resolve, reject) => {
      (new Azure())
        .init(projectId)
        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = Builder;