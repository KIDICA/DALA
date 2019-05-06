import Router from 'vue-router';
import Glider from "../components/cala/Glider";
import Predictor from "../components/cala/Predictor";
import Grid from "../components/cala/Grid";
import Cam from "../components/cala/Cam";
import Item from "../components/cala/Item";
import List from "../components/cala/ImageList";
import Hub from "../components/cala/Hub";
import Stack from "../components/cala/Stack";

const router = new Router({
  routes: [
    // Unlabeled image stack
    {
      path: '/',
      component: Stack
    },

    // Live viewer
    {
      path: '/hub',
      component: Hub
    },

    // List
    {
      path: "/list",
      redirect: "/list/tagged/10/0",
    },
    {
      path: "/list/:type",
      redirect: "/list/:type/10/0",
    },
    {
      path: '/list/:type/:take/:skip/:index?',
      component: List
    },

    // Glider
    {
      path: "/glide/:type",
      redirect: "/glide/:type/10/0",
    },
    {
      path: '/glide/:type/:take/:skip/:index?',
      component: Glider
    },

    // Other
    {
      path: "/grid",
      component: Grid,
    },
    {
      path: '/predictor',
      component: Predictor
    },
    {
      path: '/capture',
      component: Cam
    },
    {
      path: '/item/:id',
      component: Item
    }
  ]
});

export default router;