<template>
  <div>
    <cala-busy ref="busy"></cala-busy>
    <div class="card border-0 rounded-0 pl-3 pr-3 pt-2 pb-2" style="background: #E9E7E5">
      <div class="card-body pt-1 pb-1">
        <div v-if="!hasImages" class="text-center row m-2">
          <div class="col">
            <span class="mr-2">No data loaded yet.</span>
            <font-awesome :icon="'sync-alt'"></font-awesome>
          </div>
        </div>

        <template v-if="hasImages">
          <div class="row text-center mb-4">
            <div class="col">
              <span ref="timestamp" class="mr-3 text-secondary h6">Last Updated: {{formattedUpdate}}</span>

              <button class="btn btn-outline-primary border-0 pl-3 pr-3 text-secondary" @click="paused=!paused">
                <span v-if="paused">
                  <span class="font-weight-bolder mr-2">+{{imageBuffer.length}}</span> <font-awesome :icon="'sync-alt'"></font-awesome>
                </span>
                <span v-else>
                   <font-awesome :icon="'pause'"></font-awesome>
                </span>
              </button>
            </div>
          </div>

          <div v-for="(image, index) in images" :key="image.id" class="item row text-center pb-3 mb-3 border-bottom border-success" v-bind:class="image.className">
            <!-- This arrangement is not particularly elegant and stems from the reasons that by design one tag is left and one right -->

            <div class="col pr-0">
              <template v-if="tags.length > 0">
                <div v-if="hasIterations" class="progress left bg-transparent w-100 text-right" style="right: 0;">
                  <div v-bind:style="{ width: (image.probability[tags[0].id]*100) + '%'}" class="progress-bar bg-success" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                    <span v-if="image.probability[tags[0].id]>0.3" class="pr-2 pl-2" style="min-width: 4rem">{{(image.probability[tags[0].id]*100).toFixed(2)}}%</span>
                    <span v-else class="pr-2 pl-2 text-dark" style="min-width: 4rem">{{(image.probability[tags[0].id]*100).toFixed(2)}}%</span>
                  </div>
                </div>

                <button @click="tagImage(image, tags[0], index, $event)" class="btn btn-lg font-weight-bolder btn-tag" v-bind:class="{'btn-secondary': image.tagSet[tags[0].id], 'btn-outline-primary': !image.tagSet[tags[0].id]}" style="right: 0;">
                  {{tags[0].name}}
                  <font-awesome v-if="image.tagSet[tags[0].id]" icon="check"></font-awesome>
                </button>

                <button class="btn p-0" @click="unlabel(image, index)" style="position:absolute; bottom: 0; right: 1em;">
                  <font-awesome icon="times" style="font-size: 1.2em;" class="text-primary"></font-awesome>
                  <br/>
                  <small>Unlabel</small>
                </button>
              </template>
            </div>

            <div style="margin-right: -.5em; margin-left: -.5em; z-index: 2;">
              <img class="img-thumbnail shadow-sm rounded-0 dia" v-bind:src="image.thumbnailUrl"/>
            </div>

            <div class="col pl-0">
              <template v-if="tags.length > 0">
                <div v-if="hasIterations" class="progress right bg-transparent w-100 text-left" style="left: 0;">
                  <div v-bind:style="{ width: (image.probability[tags[1].id]*100) + '%'}" class="progress-bar bg-primary" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                    <span v-if="image.probability[tags[1].id]>0.3" class="pl-2 pr-2 text-white" style="min-width: 4rem">{{(image.probability[tags[1].id]*100).toFixed(2)}}%</span>
                    <span v-else class="pl-2 pr-2 text-dark" style="min-width: 4rem">{{(image.probability[tags[1].id]*100).toFixed(2)}}%</span>
                  </div>
                </div>

                <button @click="tagImage(image, tags[1], index, $event)" class="btn btn-lg font-weight-bolder btn-tag" v-bind:class="{'btn-secondary': image.tagSet[tags[1].id], 'btn-outline-primary': !image.tagSet[tags[1].id]}" style="left: 0;">
                  {{tags[1].name}}
                  <font-awesome v-if="image.tagSet[tags[1].id]" icon="check"></font-awesome>
                </button>

                <button class="btn p-0" @click="deleteImage(image, index)" style="position: absolute; bottom:0; left: 1em;">
                  <font-awesome icon="trash" class="text-primary"></font-awesome>
                  <br/>
                  <small>Delete</small>
                </button>
              </template>
            </div>
          </div>

          <button v-if="pagination.skip < imageCount" class="btn btn-block btn-primary" @click="more">More</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  import cb from "./Busy";
  import imageStore from "../store/images";
  import event from "../config/events.json";
  import * as moment from "moment";
  import animation from "../utils/animation";

  export default {
    name: "cala-imagelist",
    props: {
      removeButton: Boolean,
    },
    components: {
      "cala-busy": cb,
    },
    data() {
      return {
        button: {
          remove: ((typeof this.removeButton === "undefined") ? true : this.removeButton),
        },
        pagination: {
          skip: 0,
          take: 10,
        },
        images: [],
        formattedUpdate: "",
        imageBuffer: [],
        paused: false,
        lastUpdate: Date.now(),
        loaded: false,
        busy: false,
      };
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      },
      images() {
        if (this.loaded && (this.images.length === 0)) {
          this.load();
        }
      },
      paused(val) {
        if (!val) {
          this.flushBuffer();
        }
      },
      $route() {
        if (this.threadId) {
          clearInterval(this.threadId);
        }
      },
    },
    computed: {
      hasImages: function() {
        return this.images.length > 0;
      },
      tags: {
        get() {
          return this.$store.state.tags;
        },
      },
      hasIterations: {
        get() {
          return this.$store.state.hasIterations;
        },
      },
      voidTag: {
        get() {
          return this.$store.state.voidTag;
        },
      },
      imageCount: {
        get() {
          return this.$store.state.imageCount;
        },
      },
    },
    methods: {
      unlabel(image, index) {
        this.$query(`
            mutation {
              unlabel(imageId: "${image.id}")
            }`)
          .then(result => {
            if (result.unlabel) {
              image.tagSet = {};
              this.$set(this.images, index, image);
            }
          });
      },
      more() {
        this.pagination.skip += this.pagination.take;
        this.load();
      },
      flushBuffer() {
        const len = this.imageBuffer.length;
        for (let i = 0; i < len; i += 1) {
          this.images.unshift(this.imageBuffer.pop());
        }
      },
      tagImage(image, tag, index, $event) {
        this.busy = true;
        this.images[index].busy = true;
        imageStore.tagImage({imageId: image.id, tagId: tag.id})
          .then(() => {
            this.$socket.emit(event.socket.broadcast.image.tagged, {image, tag});
            image.tagSet = {};
            image.tagSet[tag.id] = true;
            this.$set(this.images, index, image);
            this.images[index].busy = true;
            this.busy = false;
            animation.pulse($event.target);
          })
          .catch(error => {
            alert(error);
            this.images[index].busy = true;
          });
      },
      deleteImage(image) {
        if (!window.confirm("Delete image?")) {
          return;
        }
        this.busy = true;
        imageStore.destroy(image)
          .then(() => {
            this.$socket.emit(event.socket.broadcast.image.remove, image);
            setTimeout(() => this.removeImage(image), 700);
            this.busy = false;
          });
      },
      mapImage(image) {
        return new Promise(resolve => {
          image.tagSet = {};
          image.className = "";
          image.busy = false;
          if (image.tags) {
            image.tags.forEach(tag => image.tagSet[tag.id] = true);
          }

          if (this.hasIterations) {
            imageStore.predictUrl(image.imageUrl)
              .then(probabilities => {
                const ps = {};
                probabilities.forEach(p => ps[p.tag.id] = p.probability);
                image.probability = ps;
                resolve(image);
              })
              .catch(error => {
                this.$log.error(error);
                if (error === "Nothing trained yet") {
                  resolve(image);
                }
              });
            return;
          }

          resolve(image);
        });
      },
      pushImage(image) {
        if (this.images.length > 10) {
          this.images.pop();
        }
        this.images.unshift(image);
      },
      load() {
        this.busy = true;
        this.loaded = false;
        this.images = [];
        imageStore.all(this.pagination)
          .then(images => {
            images.forEach((image, index) => {
              image.index = index;
              this.mapImage(image).then(this.pushImage);
            });
            this.loaded = true;
            this.busy = false;
          });
      },
      computeLastUpdate() {
        this.formattedUpdate = moment(this.lastUpdate).fromNow();
      },
      /**
       *
       * @param {{id: String}} image
       * @param {Function<{}>} fn
       */
      updateImage(findImage, fn) {
        for (let i = 0; i < this.images.length; i += 1) {
          const image = this.images[i];
          if (image.id === findImage.id) {
            const result = fn(image);
            this.$set(this.images, i, result);
            break;
          }
        }
      },
      /**
       * @param {{id: String}} image
       */
      removeImage(image) {
        this.images.splice(this.images.indexOf(image), 1);
      },
      listen() {
        this.$socket.on(event.socket.broadcast.image.remove, image => {
          this.removeImage(image);
        });

        this.$socket.on(event.socket.broadcast.image.tagged, tagAndImage => {
          this.updateImage(tagAndImage.image, image => {
            image.tagSet[tagAndImage.tag.id] = true;
            return image;
          });
        });

        this.$socket.on(event.socket.broadcast.image.upload, (image) => {
          this.lastUpdate = Date.now();
          this.mapImage(image).then(image2 => {
            if (this.paused) {
              this.imageBuffer.push(image2);
            } else {
              this.pushImage(image2);
            }
          });
        });
      },
    },
    mounted() {
      this.load();
      this.listen();

      // Update last update display continuously.
      this.computeLastUpdate();
      this.threadId = setInterval(() => {
        this.computeLastUpdate();
      }, 5000);
    },
  };
</script>

<style scoped>
  .btn-lg {
    min-width: 6em;
    box-shadow: 0 0 1px 0px white inset, 0px 0px 1px 2px white;
  }

  .btn-outline-primary {
    background: white;
  }

  .btn-outline-primary:hover {
    color: white;
    background: dimgray;
  }

  .dia {
    object-fit: contain;
    height: 140px;
    width: 140px;
  }

  .progress {
    max-width: 12em;
    height: 2em;
    border-radius: 0;
    top: .3em;
    position: absolute;
    z-index: 1;
  }

  .btn-tag {
    position: absolute;
    top: 1.3em;
    padding: 0.5em 1.6em;
  }

  .progress.left {
    direction: rtl;
  }

  .progress.right {
    direction: ltr;
  }
</style>