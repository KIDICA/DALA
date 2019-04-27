<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <div v-if="hasImages">
      <div ref="slideContainer" class="p-2 slider glide glide--ltr glide--carousel glide--swipeable">
        <div class="slider__track glide__track" data-glide-el="track">
          <ul class="slider__slides glide__slides" style="margin: 0">
            <li class="glide__slide" v-for="image in images" :key="image.id">
              <img class="img-thumbnail" v-bind:class="image.className" v-bind:data-id="image.id" v-bind:src="image.thumbnailUrl">
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="mx-auto text-center mt-5" style="width: 70%;">
        <h4><i class="fa fa-battery-quarter"></i> Nothing there yet.</h4>
      </div>
    </div>

    <cala-overlay ref="overlay" v-bind:class="{'hidden' : busy}">
      <slot>
        <div v-if="hasImages" class="btn btn-group mb-1" ref="controls">
          <button @click="tagImage(tag.id)"
                  v-bind:class="{ 'btn-success animated heartBeat': tag.highlight, 'btn-secondary' : !tag.highlight }"
                  class="btn btn-lg tag shadow-sm" v-bind:data-id="tag.id" :key="tag.id"
                  v-for="tag in tags">
            {{tag.name}}
          </button>
        </div>
        <div class="btn-group btn-group-lg">
          <div class="btn-group">
            <button class="btn btn-lg btn-info animated heartBeat" v-if="guess">
              Guess: {{guess}}
              <i class="fa fa-brain"></i>
            </button>
            <cala-upload url="/api/cala/upload" v-on:uploading="startUpload" v-on:uploaded="uploaded"></cala-upload>
          </div>
        </div>
      </slot>
    </cala-overlay>
  </div>
</template>

<script>
  import Glide from '@glidejs/glide';
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
        labeled: 0,
        unlabeled: 0,
        initSlider: false,
        busy: false,
        destroyed: false,
        guess: undefined
      };
    },
    computed: {
      hasImages: function () {
        return this.images.length > 0;
      },
      tags: {
        get() {
          return this.$store.state.tags
        },
        set(tags) {
          this.$store.state.tags = tags.map(tag => {
            tag.highlight = false;
            return tag;
          });
        }
      }
    },
    watch: {
      images(val) {
        if (val.length > 0) {
          this.initSlider = true;
        }
      },
      $route() {
        this.guess = undefined;
        this.load();
      },
      busy(val) {
        this.$refs.busy.work = val;
      }
    },
    methods: {
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
        this.$query(`
          {
            image(id:"${id}") {
              id, imageUrl,  thumbnailUrl, tags {
                id, name
              },
            }
          }`).then(response => {
          this.$log.debug("get-image", id, response);
          const image = response.image;
          if (image.tags.length > 0) {
            this.selectTag(image.tags.map(tag => tag.id));
            this.busy = false;
          }
        }).catch(this.$log.error);
      },
      startUpload() {
        this.busy = true;
      },
      uploaded() {
        if (this.isUntagged()) {
          this.load();
        } else {
          this.$router.push("/glide/untagged");
        }
      },
      selectTag(ids) {
        if (!Array.isArray(ids)) {
          ids = [ids];
        }
        ids.forEach(id => {
          this.tags.map(tag => {
            tag.highlight = tag.id === id;
            return tag;
          });
        });
      },
      postTag(tagData) {
        return new Promise((resolve, reject) => {
          this.busy = true;
          this.$log.debug("POST", tagData);
          this.$http.post("/api/cala", tagData)
            .then(response => {
              const ids = response.data.created.map(tag => tag.tagId);
              this.$log.debug("tag-data", ids);
              this.selectTag(ids);
              this.busy = false;
              resolve();
            })
            .catch(error => {
              this.busy = false;
              window.alert(error.message);
              reject(error);
            });
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

        this.postTag(data)
          .then(() => {
            if (this.isUntagged()) {
              this.removeCurrent();
            }
          })
      },
      removeCurrent() {
        if (this.images.length > 0) {
          this.images[this.glide.index].className = "animated zoomOut";
          setTimeout(() => {
            this.images.splice(this.glide.index, 1);
          }, 500);
        } else if (!this.destroyed) {
          this.glide.destroy();
          this.destroyed = true;
        }
      },
      predict() {
        this.busy = true;
        this.$query(`
          {
            predictUrl(url: "${this.images[this.glide.index].imageUrl}") {
              probability,
              tag {
                id, name
              }
            }
          }
          `).then(result => {
          if (result.predictUrl && result.predictUrl.length > 0) {
            const maxP = result.predictUrl.sort((a, b) => b.probability - a.probability)[0];
            this.guess = `${maxP.tag.name} (${(maxP.probability * 100).toFixed(2)}%)`;
          } else {
            this.guess = "none yet";
          }
          this.busy = false;
          this.$log.debug(result);
        }).catch(error => {
          this.busy = false;
          this.$log.error(error);
          alert(error);
        });
      },
      initGlide() {
        this.glide = new Glide(this.$refs.slideContainer, {
          type: 'carousel',
          startAt: 0,
          perView: 1.5,
          gap: 2,
          focusAt: 'center',
        });

        this.glide.on("swipe.end", () => {
          this.guess = undefined;
          this.busy = true;
          this.tags.forEach((tag, index) => this.tags[index].highlight = false);
          if (this.isUntagged()) {
            this.predict();
          }
          this.highlightTag();
        });

        this.glide.on("mount.after", () => {
          this.highlightTag();
        });

        this.glide.mount();
      },
      load() {
        this.busy = true;
        this.$query(`
        {
          images(type: ${this.$route.params.type}) {
            id, created, imageUrl, thumbnailUrl
          }
        }
      `).then(response => {
          this.images = response.images.map(image => {
            image.className = "";
            return image;
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
        if (this.glide) {
          this.glide.destroy();
        }
        this.initGlide();
        if (this.isUntagged()) {
          this.predict();
        }
        this.initSlider = false;
      }
    },
    destroyed() {
      if (this.glide) {
        this.glide.destroy();
      }
    }
  }
</script>

<style scoped>
  @import '~@glidejs/glide/dist/css/glide.core.min.css';
  @import "~animate.css/animate.min.css";

  img {
    width: 100%;
  }

  .hidden {
    visibility: hidden;
  }
</style>