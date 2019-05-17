<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white p-0">
    <div class="pt-1 pb-1 pl-2 pr-2">
      <div class="navbar-brand mb-0" v-html="param.title" v-if="param.showTitle"></div>
      <slot></slot>
    </div>
    <div class="gradient" id="line" v-if="param.showLine"></div>
  </nav>
</template>

<script>
  export default {
    name: "cala-nav",
    props: {
      title: String,
      position: String,
      bgClass: String,
      showLine: Boolean,
      showTitle: Boolean,
    },
    data() {
      return {
        param: {
          title: this.title || "",
          showLine: this.showLine,
          showTitle: this.showTitle,
        },
        className: {
          bg: this.bgClass || "bg-light"
        },
        top: this.position === "top"
      };
    },
  }
</script>

<style scoped>
  #line {
    width: 100%;
    height: 13px;
  }

  .navbar {
    color: #4A494A;
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
    color: #4A494A;
    font-family: Helvetica;
    font-size: 1.3em;
    margin: 0;
    padding: 0;
  }

  .navbar button {
    font-size: 1em;
  }
</style>