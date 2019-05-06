<template>
  <div>
    <img v-bind:src="image.src" class="rounded"/>

    <cala-overlay ref="overlay" v-bind:class="{'hidden' : busy}">
      <slot>
        <div v-if="hasImages" class="btn btn-group mb-1" ref="controls">
          <button @click="tagImage(tag.id)" class="btn btn-lg tag shadow-sm" v-bind:data-id="tag.id" :key="tag.id" v-for="tag in tags">
            {{tag.name}}
          </button>
        </div>
      </slot>
    </cala-overlay>
  </div>
</template>

<script>
  import Overlay from "./Overlay";

  export default {
    name: "cala-image",
    components: {
      "cala-overlay": Overlay
    },
    props: {
      image: Object
    },
    data() {
      return this.image;
    },
    computed: {
      tags: {
        get() {
          return this.$store.state.tags
        }
      }
    },
    methods: {
      /**
       * @param param.id {string} Tag UUID
       */
      tagImage(tagId) {
        const data = {imageId: this.image.id, tagId};
        this.$log.debug("tag-image", data);

        this.postTag(data)
          .then(() => {
            this.$router.go(-1);
          });
      },
    }
  }
</script>

<style scoped>

</style>