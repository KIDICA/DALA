const {buildSchema} = require('graphql');
const graphqlHTTP = require('express-graphql');
const apiBuilder = require("../../../api/azure");
const fs = require("fs");
const schema = fs.readFileSync(__dirname + '/schema.graphql', 'utf8');

var api = undefined;
(async function () {
  api = await apiBuilder.create();
}());

const root = {
  async image(args) {
    const id = args.id;
    const image = (await api.getImageById(id))[0];

    return {
      id: image.id,
      created: image.created,
      imageUrl: image.thumbnailUri,
      thumbnailUrl: image.originalImageUri,
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
    const type = args.type;
    const tagId = args.tagId ? [args.tagId] : null;
    const result =
      // type argument given?
      type ?
        // Which type
        type === "tagged"
          ? await api.getTaggedImages({take: args.take, skip: args.skip, tagIds: tagId})
          : await api.getUntaggedImages({take: args.take, skip: args.skip})
        // No type argument
        : (await api.getTaggedImages({take: args.take, skip: args.skip, tagIds: tagId}))
          .concat(
            await api.getUntaggedImages({take: args.take, skip: args.skip})
          );

    return result.map(image => {
      return {
        hasTags: image.tags !== null,
        id: image.id,
        created: image.created,
        imageUrl: image.thumbnailUri,
        thumbnailUrl: image.originalImageUri,
        tags: image.tags ? image.tags.map(tag => {
          return {id: tag.tagId, name: tag.tagName};
        }) : null
      };
    })
  },

  readUpload(file) {
    const path = __dirname + `/../../../public/uploads/${file}`;
    console.debug("path", path);
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
    const training = await api.train(function (status) {
      console.debug(status);
    });

    console.debug(training);

    return {
      id: training.iterationId,
      name: training.name,
      status: training.status,
      created: training.created,
    };
  },

  async predictions(args) {
    const results = await api.getPredictionHistory(this.readUpload(args.file));

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
  },

  async tags(args) {
    return await api.getTags({skip: args.skip, take: args.take});
  },

  async tagCounts() {
    return await api.getLabelCounts();
  },

  async predictUrl(url) {
    const result = await api.predictUrl(url);

    return result.predictions.map(p => {
      return {
        probability: p.probability,
        tag: {
          id: p.tagId,
          name: p.tagName,
        }
      }
    });
  }
};

module.exports = graphqlHTTP({
  schema: buildSchema(schema),
  rootValue: root,
  graphiql: true
});