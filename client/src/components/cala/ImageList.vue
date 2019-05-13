<template>
  <div>
    <cala-busy ref="busy"></cala-busy>
    <div class="card border-0 rounded-0 pl-3 pr-3 pt-2 pb-2" style="background: #E9E7E5">
      <div class="card-body pt-1 pb-1">
        <div v-if="!hasImages" class="text-center row m-2">
          <div class="col">
            No data.
          </div>
        </div>

        <template v-if="hasImages">
          <div class="row text-center" id="loadInfo" v-if="imageBuffer.length > 0">
            <div class="col">
              <button class="btn btn-danger p-0 pl-2 pr-2" @click="flushBuffer">{{imageBuffer.length}}</button>
            </div>
          </div>
          <div v-for="(image, index) in images" :key="image.id" class="row animated text-center pb-3 mb-3 border-bottom border-success" v-bind:class="image.className">
            <!-- This arrangement is not particularly elegant and stems from the reasons that by design one tag is left and one right -->

            <div class="col pr-0">
              <div v-if="!image.hasTags && image.probability" class="progress left bg-secondary w-100 text-right" style="right: 0;">
                <div v-bind:style="{ width: (image.probability[tags[0].id]*100) + '%'}" class="progress-bar bg-success" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <span class="pr-2">{{(image.probability[tags[0].id]*100).toFixed(2)}}%</span>
                </div>
              </div>

              <button @click="tagImage(image, tags[0], index)" class="btn btn-lg font-weight-bolder btn-outline-primary btn-tag" style="right: 0;">
                {{tags[0].name}}
                <font-awesome icon="check" v-if="image.tagSet[tags[0].id]"></font-awesome>
              </button>

              <button class="btn p-0" @click="unlabel(image)" style="position:absolute; bottom: 0; right: 1em; font-size: 0.9em;">
                <font-awesome icon="times" class="text-primary"></font-awesome>
                <br/>
                <small>Unlabel</small>
              </button>
            </div>

            <div style="margin-right: -.5em; margin-left: -.5em; z-index: 2;">
              <img class="img-thumbnail shadow-sm rounded-0 dia" v-bind:src="image.thumbnailUrl"/>
            </div>

            <div class="col pl-0">
              <div v-if="!image.hasTags && image.probability" class="progress left bg-transparent w-100 text-left" style="left: 0;">
                <div v-bind:style="{ width: (image.probability[tags[1].id]*100) + '%'}" class="progress-bar bg-primary" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <span class="pl-2">{{(image.probability[tags[1].id]*100).toFixed(2)}}%</span>
                </div>
              </div>

              <button @click="tagImage(image, tags[1], index)" class="btn btn-lg font-weight-bolder btn-outline-primary btn-tag" style="left: 0;">
                {{tags[1].name}}
                <font-awesome icon="check" v-if="image.tagSet[tags[1].id]"></font-awesome>
              </button>

              <button class="btn p-0" @click="deleteImage(image, index)" style="position: absolute; bottom:0; left: 1em; font-size: 0.9em;">
                <font-awesome icon="trash" class="text-primary"></font-awesome>
                <br/>
                <small>Delete</small>
              </button>
            </div>

          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  import cb from "./Busy";
  import imageStore from "../../store/images";

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
          remove: ((typeof this.removeButton === "undefined") ? true : this.removeButton)
        },
        images: [],
        imageBuffer: [],
        take: 10,
        loaded: false,
        busy: false
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
      }
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
    },
    methods: {
      flushBuffer() {
        const len = this.imageBuffer.length;
        for (let i = 0; i < len; i += 1) {
          this.images.unshift(this.imageBuffer.pop());
        }
      },
      unlabel(image) {
        alert("Insert implementation");
      },
      tagImage(image, tag, index) {
        this.busy = true;
        imageStore.tagImage({imageId: image.id, tagId: tag.id})
          .then(tag2 => {
            this.$socket.emit("tag-image", tag);
            image.tagSet[tag.id] = true;
            image.hasTags = true;
            setTimeout(() => {
              this.images[index].className = "bounceOutLeft";
              setTimeout(() => this.images.splice(index, 1), 700);
            }, 1000);
            this.busy = false;
          });
      },
      deleteImage(image, index) {
        if (!window.confirm("Delete image?")) {
          return;
        }
        this.busy = true;
        imageStore.destroy(image)
          .then(() => {
            this.$socket.emit("image-delete", image);
            this.images[index].className = "bounceOutLeft";
            setTimeout(() => this.images.splice(index, 1), 700);
            this.busy = false;
          });
      },
      mapImage(image) {
        return new Promise(resolve => {
          // Only predict when we don't have any tags.
          image.hasTags = image.tags !== null;
          image.tagSet = {};
          image.className = "bounceInLeft";
          if (!image.hasTags) {
            imageStore.predictUrl(image.imageUrl)
              .then(probabilities => {
                let ps = {};
                probabilities.forEach(p => ps[p.tag.id] = p.probability);
                image.probability = ps;
                resolve(image);
              }).catch(error => {
              this.$log.error(error);
              if (error === "Nothing trained yet") {
                resolve(image);
              }
            });
            return;
          } else {
            image.tags.forEach(tag => image.tagSet[tag.id] = true);
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
        imageStore.all({take: this.take})
          .then(images => {
            // Don't spam the API.
            images.reverse()
              .forEach(image => setTimeout(() => this.mapImage(image).then(this.pushImage)), 1000);
            this.loaded = true;
            this.busy = false;
          });
      }
    },
    mounted() {
      this.load();
      this.$socket.on("broadcast-image-upload", (image) => {
        this.mapImage(image).then(image2 => this.imageBuffer.push(image2));
      });
    }
  }
</script>

<style scoped>
  #loadInfo {
    position: absolute;
    z-index: 10;
    margin: 0 auto;
    left: 0;
    right: 0;
    top: 0;
  }

  .shadow-sm {
    box-shadow: 0 .125rem .25rem rgba(0, 0, 0, .35) !important;
  }

  .btn-lg {
    min-width: 6em;
    box-shadow: 0 0 1px 0px white inset, 0px 0px 1px 2px white;
  }

  .progress {
    max-width: 12em;
    height: 2em;
    border-radius: 0;
    top: .3em;
    position: absolute;
    z-index: 1;
  }

  .shadow-sm {
    box-shadow: 0 .025rem .15rem rgba(0, 0, 0, .35) !important;
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

  .btn-tag {
    position: absolute;
    top: 1.3em;
    padding: 0.5em 1.6em;
  }
</style>