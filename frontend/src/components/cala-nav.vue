<template>
  <nav class="navbar navbar-dark bg-dark">
    <div class="navbar-brand" v-html="brand"></div>
    <slot></slot>
  </nav>
</template>

<script>
  export default {
    name: "cala-nav",
    props: {
      title: String,
      position: String,
      bgClass: String
    },
    data() {
      return {
        className: {
          bg: this.bgClass || "bg-light"
        },
        brand: this.title || "",
        top: this.position === "top"
      };
    },
  }
</script>

<style scoped>
  .navbar {
    display: table;
    width: 100%;
    z-index: 2;
    border-bottom: dimgray;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  .navbar-brand {
    font-family: Serif;
    font-size: 2em;
    margin: 0;
    padding: 0;
  }

  .navbar button {
    font-size: 1em;
  }
</style>