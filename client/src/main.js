import Vue from "vue";
import router from "./route/router";
import VueLogger from "vuejs-logger";
import axios from "axios";
import io from "socket.io-client";
import env from "./utils/environment";
import network from "./utils/network";
import store from "./store/state";
import App from "./App.vue";
import events from "./config/events";

import {library} from "@fortawesome/fontawesome-svg-core";
import {
  faChartArea,
  faBatteryQuarter,
  faCamera,
  faUpload,
  faBrain,
  faTrash,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

// |========================================================|
// | Application bootstrapping                              |
// |========================================================|

// Include them one by one to keep the binary small.
library.add(faChartArea, faCamera, faUpload, faBrain, faTrash, faTimes, faBatteryQuarter, faCheck);
Vue.component("font-awesome", FontAwesomeIcon);

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

Vue.config.productionTip = false;

// |========================================================|
// | Global functions and variables.                        |
// |========================================================|

const socket = io(env.urls.socket);

Vue.prototype.$base = env.urls.http;
Vue.prototype.$http = axios.create({baseURL: env.urls.http});
Vue.prototype.$query = network.query;
Vue.prototype.$socket = socket;

Vue.config.errorHandler = function(err) {
  alert("Exception: " + err);
};

const error = window.console.error;
window.console.error = function(...args) {
  alert(args);
  socket.emit(events.socket.clientError, args);
  error.apply(this, args);
};

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
