<template>
  <div id="app">
    <cala-nav title="CALA | Labeling">
      <slot>
        <div class="btn-group btn-group-sm float-right p-1" role="group">
          <!--
          <router-link tag="button" class="btn btn-success" to="/glide/tagged">
            <i class="fa fa-tags"></i> <span class="badge badge-dark ml-1">{{count.labeled}}</span>
          </router-link>
          <router-link tag="button" class="btn btn-danger" to="/stack">
            <span class="badge badge-dark ml-1">Labeling</span>
          </router-link>
          <router-link tag="button" class="btn btn-secondary" to="/grid">
            <i class="fas fa-images"></i>
          </router-link>

          <router-link tag="button" class="btn btn-info" to="/list">
            <i class="fa fa-list"></i>
          </router-link>
          -->
          <router-link tag="button" class="btn btn-primary" to="/hub">
            <font-awesome icon="chart-area"></font-awesome>
          </router-link>
          <router-link tag="button" class="btn btn-dark" to="/">
            <font-awesome icon="camera"></font-awesome>
          </router-link>
        </div>

        <div class="subtext text-dark w-100 d-block">
          {{count.unlabeled+count.labeled}} Picture Uploaded | {{count.unlabeled}} Unlabeled
        </div>
      </slot>
    </cala-nav>

    <div class="container-fluid">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import cn from "./components/cala/Nav";
  import "../src/assets/css/bootstrap/dist/css/bootstrap.min.css";

  export default {
    name: 'app',
    components: {
      "cala-nav": cn
    },
    data() {
      return {}
    },
    computed: {
      count: {
        get() {
          return this.$store.state.count
        },
        set(count) {
          this.$store.state.count = count;
        }
      }
    },
    mounted() {
      // Everything on the page must be SSL requested.
      setTimeout(function() {
        // This hides the address bar:
        window.scrollTo(0, 1);
      }, 0);
    }
  }
</script>

<style>
  body {
    margin: 0;
    padding: 4em 0 0;
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
