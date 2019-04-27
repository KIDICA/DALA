<template>
  <div id="app">
    <cala-nav title="CALA">
      <slot>
        <div class="btn-group btn-group-sm float-right p-1" role="group">
          <router-link tag="button" class="btn btn-success" to="/glide/tagged">
            <i class="fa fa-tags"></i> <span class="badge badge-dark ml-1">{{count.labeled}}</span>
          </router-link>
          <router-link tag="button" class="btn btn-danger" to="/glide/untagged">
            <i class="fa fa-user-tag"></i> <span class="badge badge-dark ml-1">{{count.unlabeled}}</span>
          </router-link>
          <!--
          <router-link tag="button" class="btn btn-secondary" to="/grid">
            <i class="fas fa-images"></i>
          </router-link>
          -->
          <router-link tag="button" class="btn btn-info" to="/list">
            <i class="fa fa-list"></i>
          </router-link>

          <router-link tag="button" class="btn btn-primary" to="/dashboard">
            <i class="fa fa-chart-line"></i>
          </router-link>

          <router-link tag="button" class="btn btn-dark" to="/capture">
            <i class="fas fa-camera"></i>
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
    width: 100%;
  }

  @import '~bootstrap/dist/css/bootstrap.min.css';

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
</style>
