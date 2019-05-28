<template>
  <div id="app">
    <cala-nav title="DALA" ref="nav" v-bind:show-line="showLine">
      <slot>
        <div class="btn-group btn-group-sm float-right p-1" role="group" v-if="showButtons">
          <template v-for="route in routes">
            <router-link v-if="route.show" :key="route.path" :to="route.path" class="route btn" v-bind:class="{ 'btn-secondary': $route.path !== route.path }" active-class="btn-primary">
              <font-awesome v-if="route.icon" :icon="route.icon"/>
            </router-link>
          </template>
        </div>

        <div ref="subtitle" class="subtext text-dark w-100 d-block" v-if="showSubtitle">
          {{count.unlabeled+count.labeled}} Picture Uploaded | {{count.unlabeled}} Unlabeled
        </div>
      </slot>
    </cala-nav>

    <div class="container-fluid">
      <keep-alive include="/">
        <router-view ref="view"></router-view>
      </keep-alive>
    </div>
  </div>
</template>

<script>
  import cn from "./components/cala/Nav";
  import "../src/assets/css/bootstrap/dist/css/bootstrap.min.css";
  import routes from "./route/routes";

  export default {
    name: "app",
    components: {
      "cala-nav": cn,
    },
    data() {
      return {
        title: "DALA",
        showLine: true,
        routes,
        showSubtitle: false,
        showButtons: false,
      };
    },
    computed: {
      count: {
        get() {
          return this.$store.state.count;
        },
        set(count) {
          this.$store.state.count = count;
        },
      },
    },
    watch: {
      $route(to) {
        this.updateNav(to);
      },
    },
    methods: {
      /**
       * @param {{path: String}} to
       */
      updateNav(to) {
        const route = routes.filter(router => router.path === to.path)[0];

        if (route.nav) {
          Object.keys(route.nav)
            .forEach(key => {
              this.$refs.nav.param[key] = route.nav[key];
            });
        }

        if (route.layout) {
          Object.keys(route.layout)
            .forEach(key => this[key] = route.layout[key]);
        }
      },
    },
    mounted() {
      this.updateNav(this.$route);
    },
  };
</script>

<style>
  .border-1 {
    border-width: 1px !important;
  }

  .border-2 {
    border-width: 2px !important;
  }

  .border-3 {
    border-width: 3px !important;
  }

  .gradient {
    background-image: linear-gradient(to right, #AE0055, #7C1344);
  }

  body {
    overflow: hidden;
  }

  .subtext {
    font-size: 0.8em;
    display: inline-block;
  }

  html, body {
    height: 100%;
    width: 100%
  }
</style>
