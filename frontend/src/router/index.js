import Router from 'vue-router';
import Glider from "../components/cala-glider";
import Dashboard from "../components/cala-dashboard";
import Grid from "../components/cala-grid";
import Cam from "../components/cala-cam";
import Item from "../components/cala-item";
import List from "../components/cala-imagelist";
import Live from "../components/cala-live";

const router = new Router({
  routes: [
    // Live viewer
    {
      path: '/live',
      component: Live
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
      path: "/",
      redirect: "/glide/untagged/10/0"
    },
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
      path: '/dashboard',
      component: Dashboard
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