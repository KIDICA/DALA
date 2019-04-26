import Router from 'vue-router';
import Glider from "../components/cala-glider";
import Dashboard from "../components/cala-dashboard";
import Grid from "../components/cala-grid";
import Capture from "../components/cala-capture";
import Item from "../components/cala-item";

const router = new Router({
  routes: [
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
      component: Capture
    },
    {
      path: '/item/:id',
      component: Item
    }
  ]
});

export default router;