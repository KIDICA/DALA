<template>
  <div>
    <div class="progress">
      <div v-for="(tag, index) in tagsArray" v-bind:key="tag.id" v-bind:style="{ 'width': tag.value + '%' }" class="progress-bar progress-bar-striped" v-bind:class="classNames[index%classNames.length]" role="progressbar" v-bind:aria-valuenow="tag.value" aria-valuemin="0" aria-valuemax="50">{{tag.name}}</div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "cala-meter",
    props: {
      tags: Array,
    },
    data() {
      return {
        classNames: ["bg-success", "bg-primary"],
        tagsArray: this.tags
      };
    },
    watch: {
      tags(val) {
        this.tagsArray = val;
        // Uncomment in case if all probabilities don't add up to 1
        // this.tagsArray = val.map(tag => {
        //   tag.value = tag.value / val.length;
        //   return tag;
        // });
      },
    }
  }
</script>

<style scoped>
  .progress {
    height: 4em;
  }

  .progress-bar {
    font-size: 1.7em;
  }
</style>