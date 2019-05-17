//import Glider from "../components/cala/Glider";
//import Predictor from "../components/cala/Predictor";
//import Grid from "../components/cala/Grid";
//import Cam from "../components/cala/Cam";
//import Item from "../components/cala/Item";
//import List from "../components/cala/ImageList";
import Hub from "../components/cala/Hub";
import Stack from "../components/cala/Stack";

/**
 * @type {[{show: Boolean, icon: String, layout: {showButtons: Boolean, showSubtitle: Boolean}, title: String, nav: {showSubTitle: Boolean, showHeaderLine: Boolean, showTitle: Boolean}, path: String, , component: Object}]}
 */
const router = [
  {
    show: true,
    icon: "camera",
    title: "CALA",
    path: '/',
    component: Stack,
    nav: {
      showTitle: true,
      showLine: true,
    },
    layout: {
      showButtons: true,
      showSubtitle: true,
    }
  },

  {
    show: true,
    icon: "chart-area",
    title: "CALA - Hub",
    path: '/hub',
    component: Hub,
    nav: {
      showTitle: false,
      showLine: false,
    },
    layout: {
      showButtons: true,
      showSubtitle: false
    }
  },

  // // List
  // {
  //   path: "/list",
  //   redirect: "/list/tagged/10/0",
  // },
  // {
  //   path: "/list/:type",
  //   redirect: "/list/:type/10/0",
  // },
  // {
  //   path: '/list/:type/:take/:skip/:index?',
  //   component: List
  // },
  //
  // // Glider
  // {
  //   path: "/glide/:type",
  //   redirect: "/glide/:type/10/0",
  // },
  // {
  //   path: '/glide/:type/:take/:skip/:index?',
  //   component: Glider
  // },
  //
  // // Other
  // {
  //   path: "/grid",
  //   component: Grid,
  // },
  // {
  //   path: '/predictor',
  //   component: PredictorD
  // },
  // {
  //   path: '/capture',
  //   component: Cam
  // },
  // {
  //   path: '/item/:id',
  //   component: Item
  // }
];

export default router;