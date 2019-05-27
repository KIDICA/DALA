const {buildSchema} = require('graphql');
const graphqlHTTP = require('express-graphql');
const apiBuilder = require("../../../api/azure");
const fs = require("fs");
const schema = fs.readFileSync(__dirname + '/schema.graphql', 'utf8');
const logger = require("./../../../utils/logger");

var api = undefined;
(async function() {
  api = await apiBuilder.create();
}());

const root = {
  async image(args) {
    const id = args.id;
    const image = (await api.getImageById(id))[0];

    return {
      id: image.id,
      created: image.created,
      imageUrl: image.originalImageUri,
      thumbnailUrl: image.thumbnailUri,
      tags: image.tags ? image.tags.map(tag => {
        return {id: tag.tagId, name: tag.tagName};
      }) : null
    };
  },

  async iterations() {
    const its = await api.getIterations();

    return its.map(it => {
      return {
        id: it.id,
        name: it.name,
        created: it.created,
        status: it.status
      };
    });
  },

  async images(args) {
    const tagId = (args.tagId && args.tagId !== "") ? [args.tagId] : null;
    const filterByTagged = args.type !== "any";
    let result = [];

    if (filterByTagged) {
      result = args.type === "tagged"
        ? await api.getTaggedImages({take: args.take, skip: args.skip, tagIds: tagId})
        : await api.getUntaggedImages({take: args.take, skip: args.skip});
    } else {
      // receive all images
      result = (await api.getTaggedImages({take: args.take, skip: args.skip, tagIds: tagId}))
        .concat(
          await api.getUntaggedImages({take: args.take, skip: args.skip})
        );
    }

    return result.map(image => {
      return {
        hasTags: image.tags !== null,
        id: image.id,
        created: image.created,
        imageUrl: image.originalImageUri,
        thumbnailUrl: image.thumbnailUri,
        tags: image.tags ? image.tags.map(tag => {
          return {id: tag.tagId, name: tag.tagName};
        }) : null
      };
    })
  },

  readUpload(file) {
    const path = __dirname + `/../../../public/uploads/${file}`;
    logger.debug("readUpload", path);
    return fs.readFileSync(path);
  },

  async predictFile(args) {
    const data = this.readUpload(args.file);
    const result = await api.predict(data);

    return result.predictions.map(pred => {
      return {
        probability: pred.probability * 100,
        tag: {
          id: pred.tagId,
          name: pred.tagName
        },
        created: result.created
      };
    });
  },

  async train() {
    const training = await api.train(function(status) {
      logger.debug(status);
    });

    logger.debug(training);

    return {
      id: training.iterationId,
      name: training.name,
      status: training.status,
      created: training.created,
    };
  },

  hasIterations() {
    return api.iterations.length > 0;
  },

  async predictions(args) {
    try {
      const results = await api.getPredictionHistory(this.readUpload(args.file));
      logger.debug(results);

      return results.map(result => {
        return {
          iterationId: result.iteration,
          created: result.created,
          predictions: result.predictions.map(p => {
            return {
              probability: p.probability,
              tag: {
                id: p.tagId,
                name: p.tagName
              }
            };
          })
        };
      });
    } catch (e) {
      logger.error(e);
      throw new Error(e);
    }
  },

  async deleteImage(args) {
    try {
      logger.debug("delete:", args);
      await api.deleteImages(args.id);
    } catch (e) {
      throw new Error(e);
    }
  },

  async unlabel(args) {
    try {
      await api.deleteImageTags([args.imageId]);
      return true;
    } catch (ex) {
      logger.error(ex.message);
      return false;
    }
  },

  async tagImage(args) {
    const result = await api.tagImage(args);
    logger.debug("tag-image", result);
    return args;
  },

  async tags(args) {
    return await api.getTags({skip: args.skip, take: args.take});
  },

  async tagCounts() {
    return await api.getLabelCounts();
  },

  async predictUrl(url) {
    try {
      const result = await api.predictUrl(url);
      logger.debug(result);

      return result.predictions.map(p => {
        return {
          probability: p.probability,
          tag: {
            id: p.tagId,
            name: p.tagName,
          }
        }
      });
    } catch (e) {
      logger.error(e);
      throw new Error(e);
    }
  },

  async performance() {
    return await api.getPerformance();
  }
};

module.exports = graphqlHTTP({
  schema: buildSchema(schema),
  rootValue: root,
  graphiql: true
});