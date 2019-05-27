import net from "../utils/network";

/**
 * Contains image queries to the server.
 */
export default {
  /**
   * @param {string} [param.type]
   * @param {number} [param.take]
   * @param {number} [param.skip]
   * @param {string} [param.tagId]
   * @returns {Promise<any>}
   */
  all(param = {}) {
    return new Promise((resolve, reject) => {
      net.query(`
        {
          images(type: ${param.type || "any"}, take: ${param.take || 10}, skip: ${param.skip || 0}, tagId: "${param.tagId || ""}") {
            id, created, imageUrl, thumbnailUrl
            tags {
              id, name
            }   
          }
        }
      `).then(response => resolve(response.images))
        .catch(error => reject(error));
    });
  },
  /**
   * @param {string} imageUrl
   * @returns {Promise<Prediction>}
   */
  predictUrl(imageUrl) {
    return new Promise((resolve, reject) => {
      net.query(`
          {
            predictUrl(url: "${imageUrl}") {
              probability,
              tag {
                id, name
              }
            }
          }
          `)
        .then(result => {
          if (result.predictUrl && result.predictUrl.length > 0) {
            resolve(result.predictUrl);
          } else {
            resolve(undefined);
          }
        }).catch(error => {
        reject(error);
      });
    });
  },

  /**
   * @param {string} param.tagId
   * @param {string} param.imageId
   * @returns {Promise<{tagId: string, imageId: string}>}
   */
  tagImage(param) {
    return new Promise((resolve, reject) => {
      net.query(`
          mutation {
            tagImage(tagId: "${param.tagId}", imageId: "${param.imageId}") {
              tagId
              imageId
            }
          }
        `)
        .then((response) => resolve(response.tagImage))
        .catch(error => reject(error));
    });
  },

  /**
   * @param {string} image.id
   * @returns {Promise<void>}
   */
  destroy(image) {
    return new Promise((resolve, reject) => {
      net.query(`
          mutation {
            deleteImage(id: "${image.id}") {
              id
            }
          }
        `).then(response => resolve(response.deleteImage))
        .catch(error => reject(error));
    });
  }
};