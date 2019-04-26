<template>
  <div class="overlay">
    <slot></slot>
  </div>
</template>

<script>
  export default {}
</script>

<style scoped>
  .overlay {
    opacity: 0.9;
    position: fixed;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    bottom: 7%;
    width: 80%;
    text-align: center;
  }
</style>