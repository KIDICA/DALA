import Vue from "vue";
import VueRouter from "vue-router";
import router from "./router";
import VueLogger from "vuejs-logger";
import axios from "axios";
import io from "socket.io-client";
import env from "./helper/environment";
import network from "./helper/network";
import store from "./store/state";
import App from "./App.vue";

// |========================================================|
// | Application bootstrapping                              |
// |========================================================|

const options = {
  isEnabled: true,
  logLevel: env.isProduction ? "error" : "debug",
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: "|",
  showConsoleColors: true
};

Vue.use(VueLogger, options);
Vue.use(VueRouter);

Vue.config.productionTip = false;

// |========================================================|
// | Global functions and variables.                        |
// |========================================================|

Vue.config.errorHandler = err => {
  alert('Exception: ' + err)
};

Vue.prototype.$base = env.urls.http;
Vue.prototype.$http = axios.create({baseURL: env.urls.http});
Vue.prototype.$query = network.query;
Vue.prototype.$socket = io(env.urls.socket);

// |================================================================|
// | Global state management                                        |
// | Some data is used by multiple components reactively,           |
// | like counts and tags. A socket can update them centrally here. |
// |================================================================|

new Vue({
  router,
  store,
  render: h => h(App),
  mounted() {
    this.$store.dispatch("queryTags");
    this.$store.dispatch("queryCounts");

    this.$socket.on("broadcast-image-upload", image => {
      this.$store.commit("incrementImageCount");
      this.$store.commit("incrementUnlabeledCount");
    });

    this.$socket.on("broadcast-image-delete", image => {
      if (!image.tags) {
        this.$store.commit("incrementUnlabeledCount", -1);
      } else {
        this.$store.commit("incrementLabeledCount", -1);
      }
      this.$store.commit("incrementImageCount", -1);
    });

    this.$socket.on("broadcast-image-tagged", tag => {
      this.$store.commit("incrementLabeledCount");
      this.$store.commit("incrementUnlabeledCount", -1);
      this.$store.commit("updateTagCounts", tag);
    });
  }
}).$mount("#app");
