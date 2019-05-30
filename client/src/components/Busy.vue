<template>
  <div v-bind:class="{ 'hidden': !work }" class="spinner-border spinner text-primary" style="border-width: 1.5em" role="status">
  </div>
</template>

<script>
  export default {
    name: "cala-busy",
    data() {
      return {
        work: false
      }
    },
  }
</script>

<style scoped>
  .spinner {
    position: absolute;
    color: white;
    top: 40%;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    height: 7em;
    width: 7em;
    z-index: 1000;
  }

  .hidden {
    display: none;
  }
</style>