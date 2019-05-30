<template>
  <div class="p-2">
    <ul class="nav nav-tabs">
      <li v-for="(tag, index) in tags" class="nav-item" :key="tag.id">
        <a class="nav-link text-secondary" href="#" @click="show(tag.id, index)">{{tag.name}}</a>
      </li>
      <li class="nav-item">
        <a class="nav-link text-secondary" href="#" @click="untagged">Untagged</a>
      </li>
    </ul>

    <div class="row pl-2 pr-2">
      <div v-for="image in images" :key="image.id" style="width: 32%;">
        <img @click="$router.push(`/item/${image.id}`)" class="img-thumbnail m-2" style="height: auto;" v-bind:data-id="image.id" v-bind:src="image.thumbnailUrl">
      </div>
    </div>

    <cala-busy ref="busy"></cala-busy>
  </div>
</template>

<script>
  import cb from "./Busy";

  export default {
    name: "cala-grid",
    components: {
      "cala-busy": cb
    },
    data() {
      return {
        images: [],
        busy: false,
        filter: "tagged"
      };
    },
    computed: {
      tags: {
        get() {
          return this.$store.state.tags.map(tag => {
            tag.active = false;
            return tag;
          });
        }
      }
    },
    updated() {
      this.busy = false;
    },
    mounted() {
      if (this.tags.length > 0) {
        this.show(this.tags[0].id);
      }
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      }
    },
    methods: {
      load(tagId) {
        const tag = tagId ? `, tagId: "${tagId}"` : "";
        this.$query(`
        {
          images(type: ${this.filter} ${tag}) {
            id, created, imageUrl, thumbnailUrl, hasTags
            tags { id, name }
          }
        }
      `).then(response => {
          this.images = response.images;
        });
      },
      show(tagId) {
        this.filter = "tagged";
        this.busy = true;
        this.load(tagId);
      },
      untagged() {
        this.filter = "untagged";
        this.load();
      }
    }
  }
</script>

<style scoped>
</style>