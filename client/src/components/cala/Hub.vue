<template>
  <div class="row">
    <div class="col-1"></div>
    <div class="col-4">
      <cala-imagelist v-bind:remove-button="false"></cala-imagelist>
    </div>
    <div class="col">
      <cala-dashboard class="mt-4" style="min-height: 100%;"></cala-dashboard>
    </div>
    <div class="col-1"></div>
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
  }
</script>

<style scoped>

</style>