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
    tags: [],
    taggedInThisSession: {},
    allTags: [],
    voidTag: undefined,
    performance: {averagePrecision: 0},
    labeled: 0,
    imageCount: 0,
    snapshots: [],
    hasIterations: false,
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
      state.tags = tags.filter(tag => tag.name !== "void");
      state.allTags = tags;

      const voidTag = tags.filter(tag => tag.name === "void");
      if (voidTag.length > 0) {
        state.voidTag = voidTag[0];
      }
    },
    updateHasIterations(state, hasIterations) {
      state.hasIterations = hasIterations;
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
    addSnapshots(state, snapshot) {
      state.snapshots.push(snapshot);
    },
    incrementImageCount(state, value = 1) {
      state.imageCount += value;
    },
    incrementUnlabeledCount(state, value = 1) {
      state.count.unlabeled += value;
    },
    decrementTagsCount(state, tags) {
      tags.forEach(decTag => {
        state.tags.filter(tag => tag.id === decTag.id)[0].imageCount -= 1;
      })
    },
    incrementLabeledCount(state, value = 1) {
      state.count.labeled += value;
    },
    updateTagCounts(state, imageAndTag) {
      state.tags.filter(tag => tag.id === imageAndTag.tag.id)[0].imageCount += 1;
    },
    updatePerformance(state, performance) {
      state.performance.averagePrecision = performance.averagePrecision;
    },
  },
  actions: {
    queryHasIterations({commit}) {
      network.query(`{ iterations { id }}`)
        .then(result => commit("updateHasIterations", result.iterations.length > 0));
    },
    queryPerformance({commit}) {
      network.query(`
          {
            performance {
              averagePrecision
            }
          }
        `)
        .then(result => {
          commit("updatePerformance", result.performance);
        })
        .catch(result => {
          // Might be only no performance data yet.
          window.console.debug(result);
        });
    },
    queryCounts({commit}) {
      network.query(`
        {
          tagCounts {
            tagged, untagged
          }
        }`)
        .then(data => {
          commit("updateCount", {
            labeled: data.tagCounts.tagged,
            unlabeled: data.tagCounts.untagged,
          });
          commit("setImageCount", data.tagCounts.tagged + data.tagCounts.untagged);
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
    },
  },
});

export default store;