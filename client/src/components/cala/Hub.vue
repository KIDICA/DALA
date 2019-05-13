<template>
  <div class="row pt-3">

    <div class="col-4 pl-0 pr-0 pl-2">
      <div class="card border-primary" v-bind:style="{height: height}">
        <div class="card-header gradient text-white p-2">Image Stream</div>
        <div class="card-body p-0" style="overflow-y: scroll">
          <cala-imagelist ref="list" v-bind:remove-button="false"></cala-imagelist>
        </div>
      </div>
    </div>

    <div class="col pr-2">
      <div class="card border-primary" v-bind:style="{height: height}">
        <div class="card-header gradient text-white p-2">Prediction</div>
        <div class="card-body p-3">
          <cala-dashboard style="min-height: 100%;"></cala-dashboard>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Dashboard from "./Predictor";
  import List from "./ImageList";

  export default {
    name: "cala-live",
    components: {
      "cala-dashboard": Dashboard,
      "cala-imagelist": List
    },
    data() {
      return {
        height: "10em"
      };
    },
    methods: {
      resize() {
        this.height = (document.body.clientHeight - 100) + "px";
      }
    },
    mounted() {
      this.resize();
      window.addEventListener('resize',this.resize);
    }
  }
</script>

<style scoped>

</style>