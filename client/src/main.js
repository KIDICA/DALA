import Vue from "vue";
import router from "./route/router";
import VueLogger from "vuejs-logger";
import axios from "axios";
import io from "socket.io-client";
import env from "./utils/environment";
import network from "./utils/network";
import store from "./store/state";
import App from "./App.vue";
import event from "./config/events";

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
  faPause,
  faPlay,
  faSyncAlt,
  faCloudUploadAlt,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

// |========================================================|
// | Application bootstrapping                              |
// |========================================================|

// Include them one by one to keep the binary small.
library.add(faPlay, faChartArea, faTimesCircle, faCamera, faUpload, faBrain, faTrash, faTimes, faBatteryQuarter, faCheck, faPause, faSyncAlt, faCloudUploadAlt);
Vue.component("font-awesome", FontAwesomeIcon);

const options = {
  isEnabled: true,
  logLevel: env.isProduction ? "error" : "debug",
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: "|",
  showConsoleColors: true,
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

const error = window.console.error;

Vue.config.errorHandler = function(err) {
  socket.emit(event.socket.clientError, err);
  window.console.error(err);
  alert("Exception: " + err);
};

window.console.error = function(...args) {
  alert(args);
  socket.emit(event.socket.clientError, args);
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
  created() {
    this.$store.dispatch("queryTags");
    this.$store.dispatch("queryCounts");
    this.$store.dispatch("queryHasIterations");
    this.$store.dispatch("queryPerformance");

    this.$socket.on(event.socket.broadcast.image.unlabel, image => {
      if (image.tags) {
        this.$store.commit("decrementTagsCount", image.tags);
      }
      this.$store.commit("incrementUnlabeledCount");
    });

    this.$socket.on(event.socket.broadcast.image.upload, () => {
      this.$store.commit("incrementImageCount");
      this.$store.commit("incrementUnlabeledCount");
    });

    this.$socket.on(event.socket.broadcast.image.remove, image => {
      if (!image.tags) {
        this.$store.commit("incrementUnlabeledCount", -1);
      } else {
        this.$store.commit("incrementLabeledCount", -1);
      }
      this.$store.commit("incrementImageCount", -1);
    });

    this.$socket.on(event.socket.broadcast.image.tagged, tagAndImage => {
      this.$store.commit("incrementLabeledCount");
      this.$store.commit("incrementUnlabeledCount", -1);
      this.$store.commit("updateTagCounts", tagAndImage);
      // Any previous tag
      if (tagAndImage.image.tags) {
        this.$store.commit("decrementTagsCount", tagAndImage.image.tags);
      }
    });
  },
}).$mount("#app");
