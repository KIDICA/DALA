<template>
  <div class="card m-2 shadow-sm" style="height: 50%;">
    <div class="card-header bg-secondary text-white">Item Data</div>
    <div class="p-0 card-body bg-white">
      <div class="cover" v-bind:style="{ 'background-image': 'url(' + cover + ')' }"></div>
    </div>
    <div class="card-footer p-2">
      <div class="btn-group-sm p-0 m-0">
        <span v-for="tag in tags" :key="tag.id" class="badge badge-success m-0 p-2">{{tag.name}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "cala-item",
    data() {
      return {
        cover: "",
        tags: []
      };
    },
    methods: {
      tag(id) {
        alert(id);
      }
    },
    mounted() {
      const id = this.$route.params.id;
      this.$query(`
        {
          image(id: "${id}") {
            id
            imageUrl
            tags {
              id
              name
            }
          }
        }
      `).then(result => {
        this.cover = result.image.imageUrl;
        this.tags = result.image.tags;
      });
    }
  }
</script>

<style scoped>
  .container-fluid {
    position: absolute;
  }

  .cover {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    height: 100%;
    position: inherit;
    width: auto;
  }
</style>