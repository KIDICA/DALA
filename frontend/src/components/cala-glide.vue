<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <div ref="glider" class="glider-contain">
      <div class="glider" v-for="image  in images" :key="image.id">
        <img class="img-thumbnail" v-bind:data-id="image.id" v-bind:src="image.imageUrl">
      </div>

      <button role="button" aria-label="Previous" class="glider-prev">«</button>
      <button role="button" aria-label="Next" class="glider-next">»</button>
      <div role="tablist" class="dots" style="position: absolute; bottom: 0; left: 50%"></div>
    </div>

    <cala-overlay ref="overlay" v-bind:class="{'hidden' : busy}">
      <slot>
        <div class="btn btn-group mb-1" ref="controls">
          <button @click="tagImage(tag.id)" v-bind:class="{ 'btn-success': tag.highlight, 'btn-secondary' : !tag.highlight }" class="btn btn-lg tag shadow-sm" v-bind:data-id="tag.id" :key="tag.id" v-for="tag in tags">{{tag.name}}</button>
        </div>
        <cala-upload></cala-upload>
      </slot>
    </cala-overlay>
  </div>
</template>

<script>
  import Glider from 'glider-js';
  import cb from "./cala-busy";
  import upload from "./cala-upload";
  import overlay from "./cala-overlay";

  export default {
    name: "cala-glider",
    components: {
      "cala-busy": cb,
      "cala-upload": upload,
      "cala-overlay": overlay
    },
    data() {
      return {
        images: [],
        tags: [],
        labeled: 0,
        unlabeled: 0,
        initSlider: false,
        busy: false
      };
    },
    watch: {
      images(val) {
        if (val.length > 0) {
          this.initSlider = true;
        }
      },
      $route() {
        this.load();
      },
      busy(val) {
        this.$refs.busy.work = val;
      }
    },
    methods: {
      /**
       * @param {File} file
       * @returns {Promise<{}>}
       */
      uploadFile(file) {
        return new Promise((resolve, reject) => {
          this.busy = true;
          const formData = new FormData();
          formData.append('file', file);

          this.$http.post("/api/cala/upload", formData)
            .then(response => {
              this.busy = false;
              resolve(response);
            })
            .catch(error => {
              this.$log.debug(error);
              reject(error);
              this.busy = false;
            });
        });
      },
      display(type) {
        this.$log.debug(type);
      },
      isUntagged() {
        return this.$route.params.type === "untagged"
      },
      highlightTag() {
        if (this.isUntagged()) {
          return;
        }
        const id = this.currentImageId();
        this.$http.get("/api/cala/image/" + id)
          .then(response => {
            this.$log.debug("get-image", id, response.data);
            response.data.forEach(image => {
              if (image.tags.length > 0) {
                const id = image.tags[0].tagId;
                this.selectTag(id);
                this.busy = false;
              }
            });
          });
      },
      upload() {
        if (this.files.length > 0) {
          const file = this.files[0];
          //const reader = new FileReader();

          this.uploadFile(file)
            .then(response => {
              this.$log.debug(response);
            })
            .catch(error => {
              alert(error);
            });
          //reader.addEventListener("load", function () {
          //preview.src = reader.result;
          //this.$log.debug(bg);
          //bg.style.backgroundImage = `url("${reader.result}")`;
          //}, false);
          //reader.readAsDataURL(file);
        }
      },
      uploadClick() {
        this.$refs.image.click();
      },
      selectTag(ids) {
        if (!Array.isArray(ids)) {
          ids = [ids];
        }
        ids.forEach(id => {
          this.tags = this.tags.map(tag => {
            tag.highlight = tag.id === id;
            return tag;
          });
        });
      },
      postTag(tagData) {
        this.busy =  true;
        this.$log.debug("POST", tagData);
        this.$http.post("/api/cala", tagData)
          .then(response => {
            const ids = response.data.created.map(tag => tag.tagId);
            this.$log.debug("tag-data", ids);
            this.selectTag(ids);
            this.busy = false;
          })
          .catch(error => {
            this.busy = false;
            alert(error.message);
          });
      },
      currentImageId() {
        return this.images[this.glide.index].id;
      },
      /**
       * @param param.id {string} Tag UUID
       */
      tagImage(tagId) {
        const imageId = this.currentImageId();
        const data = {imageId, tagId};
        this.$log.debug("tag-image", data);

        this.postTag(data);
      },
      initGlide() {
        this.glider = new Glider(this.$refs.glider, {
          slidesToShow: 1,
          scrollLock: true,
          scrollLockDelay: 0,
          dots: '.dots',
          arrows: {
            prev: '.glider-prev',
            next: '.glider-next'
          }
        });
      },
      load() {
        this.busy = true;
        this.$query(`
        {
          images(type: ${this.$route.params.type}) {
            id, created, imageUrl, thumbnailUrl
          }
          tags {id, name}
        }
      `).then(response => {
          this.images = response.images;
          this.tags = response.tags.map(tag => {
            tag.highlight = false;
            return tag;
          });
          this.busy = false;
        });
      }
    },
    mounted() {
      this.load();
    },
    updated() {
      if (this.initSlider) {
        if (this.glider) {
          this.glider.destroy();
        }
        this.initGlide();
        this.initSlider = false;
      }
    },
    destroyed() {
      if (this.glider) {
        this.glider.destroy();
      }
    }
  }
</script>

<style>
  @import '~glider-js/glider.min.css';
</style>