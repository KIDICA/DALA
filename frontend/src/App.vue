<template>
  <div id="app" class="bg-light">
    <cala-nav title="CALA">
      <slot>
        <div class="btn-group float-right p-1" role="group">
          <router-link tag="button" class="btn btn-success" to="/glide/tagged">
            <i class="fas fa-tags"></i> <span class="badge badge-dark ml-1">{{count.labeled}}</span>
          </router-link>
          <router-link tag="button" class="btn btn-danger" to="/glide/untagged">
            <i class="fas fa-tags"></i> <span class="badge badge-dark ml-1">{{count.unlabeled}}</span>
          </router-link>
          <router-link tag="button" class="btn btn-secondary" to="/grid">
            <i class="fas fa-images"></i>
          </router-link>
          <router-link tag="button" class="btn btn-info" to="/dashboard">
            <i class="fas fa-brain"></i>
          </router-link>
          <router-link tag="button" class="btn btn-primary" to="/capture">
            <i class="fas fa-camera text-white"></i>
          </router-link>
        </div>
      </slot>
    </cala-nav>

    <div class="container-fluid m-0 p-0">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import cn from "./components/cala-nav";

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
  }
</script>

<style>
  #app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
  }

  @import '~bootstrap/dist/css/bootstrap.min.css';
  /*@import 'assets/style/minty.bootstrap.min.css';*/

  body {
    margin: 0;
    padding: 4em 0 0;
  }

  .container-fluid {
    height: 100%;
    position: absolute;
  }

  html, body {
    height: 100%;
    width: 100%
  }

  .nav .btn-group {
    font-size: .9em;
    width: 100%;
  }
</style>
