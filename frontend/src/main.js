import Vue from "vue";
import VueRouter from "vue-router";
import router from "./router";
import VueLogger from "vuejs-logger";
import axios from "axios";
import io from "socket.io-client";
import Vuex from "vuex";

// |========================================================|
// | Application bootstrapping                              |
// |========================================================|

const isProduction = process.env.NODE_ENV === "production";

const base = window.location.origin.split(/:\d+/)[0];

const urls = {
  http: isProduction ? base : base + ":3000/",
  graphql: isProduction ? "/graphql/v1" : base + ":3000/graphql/v1",
  socket: base + ":4200"
};

const options = {
  isEnabled: true,
  logLevel: isProduction ? "error" : "debug",
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: "|",
  showConsoleColors: true
};

Vue.use(VueLogger, options);
Vue.use(VueRouter);

import App from "./App.vue";

Vue.config.productionTip = false;

// |========================================================|
// | Global functions and variables.                        |
// |========================================================|

const http = axios.create({baseURL: urls.http});
const query = function (query) {
  return new Promise((resolve, reject) => {
    axios({
      url: urls.graphql,
      method: "POST",
      data: {
        query
      }
    }).then(response => resolve(response.data.data))
      .catch(response => {
        alert(`this.$query error:\n${JSON.stringify(response, null, 2)}`);
        reject(response);
      });
  });
};

Vue.prototype.$base = urls.http;
Vue.prototype.$http = http;
Vue.prototype.$query = query;
Vue.prototype.$socket = io(urls.socket);

// |==========================================================|
// | Global state management                                  |
// | Some data don't change globally and can be retained,     |
// | like counts and tags. A socket can update them centrally |
// |==========================================================|

Vue.use(Vuex);

/**
 * Global central store for application data. Any updated shall only be applied by calling the mutations.
 * The intent is to increase the application's performance and reduce the Cloud resource usage.
 * @type {Store}
 */
const store = new Vuex.Store({
  state: {
    images: [],
    tags: [],
    labeled: 0,
    count: {labeled: 0, unlabeled: 0},
    /**
     * Can hold the query result of a specific image by id.
     * @type {Object<String, Object>}
     */
    image: {},
    /**
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
    }
  },

  actions: {
    queryCounts({commit}) {
      query(`
        {
          tagCounts {
            tagged, untagged
          }
        }`)
        .then(data => {
          commit("updateCount", {labeled: data.tagCounts.tagged, unlabeled: data.tagCounts.untagged});
        });
    },
    queryTags({commit}) {
      query(`
      {
        tags {
          id
          name
        }
      }
      `).then(response => {
        commit("updateTags", response.tags);
      });
    }
  }
});

new Vue({
  router,
  store,
  render: h => h(App),
  mounted() {
    this.$store.dispatch("queryTags");
    this.$store.dispatch("queryCounts");
  }
}).$mount("#app");
