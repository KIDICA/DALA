import Vue from "vue";
import Vuex from "vuex";
import network from "../utils/network";

Vue.use(Vuex);

/**
 * Global central store for application data. Any updated shall only be applied by calling the mutations.
 * The intent is to increase the application's performance and reduce the Cloud resource usage.
 * @type {Store}
 */
const store = new Vuex.Store({
  state: {
    // Exchange of currently taken pictures.
    imageBuffer: [],
    tags: [],
    labeled: 0,
    imageCount: 0,
    count: {labeled: 0, unlabeled: 0},
    /**
     * TODO:
     * Only when a training has happened and a new iteration has been
     * published on on the cloud is makes sense to request a new prediction.
     * Otherwise it's senselessly and wasted cloud resource and - additionally - the application will be slow.
     * So hold the result of an prediction since the last iteration here.
     * Additionally the server can retain the prediction from the current iteration to improve the performance and limit resource usage.
     * @type {Object<String, Object>}
     */
    prediction: {},
  },
  mutations: {
    addTag(state, tag) {
      state.tags.push(tag);
    },
    updateTags(state, tags) {
      state.tags = tags;
    },
    /**
     * @param state {Object<string, Object|Array>}
     * @param {Object<id>} imagePrediction.image
     */
    setPrediction(state, imagePrediction) {
      state.prediction[imagePrediction.image.id] = imagePrediction;
    },
    updateCount(state, count) {
      state.count = count;
    },
    setImageCount(state, imageCount) {
      state.imageCount = imageCount;
    },
    addImage(state, image) {
      state.imageBuffer.push(image);
    },
    incrementImageCount(state, value = 1) {
      state.imageCount += value;
    },
    incrementUnlabeledCount(state, value = 1) {
      state.count.unlabeled += value;
    },
    incrementLabeledCount(state, value = 1) {
      state.count.labeled += value;
    },
    updateTagCounts(state, tagUpdate) {
      state.tags.forEach(tag => {
        if (tag.id === tagUpdate.tagId) {
          tag.imageCount = (tag.imageCount || 0) + 1;
        }
      })
    }
  },

  actions: {
    queryCounts({commit}) {
      network.query(`
        {
          tagCounts {
            tagged, untagged
          }
        }`)
        .then(data => {
          commit("updateCount", {labeled: data.tagCounts.tagged, unlabeled: data.tagCounts.untagged});
          commit("setImageCount", data.tagCounts.tagged + data.tagCounts.untagged)
        });
    },
    queryTags({commit}) {
      network.query(`
      {
        tags {
          id
          name
          imageCount
        }
      }
      `).then(response => {
        commit("updateTags", response.tags);
      });
    }
  }
});

export default store;