<template>
  <div class="row p-1">
    <div class="col pr-0">
      <cala-imagelist v-bind:remove-button="false"></cala-imagelist>
    </div>
    <div class="col pl-0">
      <cala-dashboard style="min-height: 100%;"></cala-dashboard>
    </div>
  </div>
</template>

<script>
  import Dashboard from "./cala-dashboard";
  import List from "./cala-imagelist";

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