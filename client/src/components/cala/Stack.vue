<template>
  <div class="h-100">
    <cala-busy ref="busy"></cala-busy>

    <div class="h-100 w-100 align-middle" style="position: relative">
      <img
          v-bind:src="image.thumbnailUrl"
          v-bind:class="'img-thumbnail ' + image.className"
          v-bind:style="{transform: 'rotate(' + image.rot + 'deg) translateX(' + image.offsetX + 'px) translateY(' + image.offsetY + 'px)' , zIndex: index}"
          v-for="(image, index) in images"
          :key="image.id"/>
    </div>

    <cala-toolbar v-if="tags.length>0">
      <slot>
        <div class="row">
          <div class="float-left col">
            <div class="progress left bg-secondary">
              <div v-bind:style="{ width: (tags[0].probability*100) + '%'}" class="progress-bar bg-success" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                {{tags[0].probabilityPercent}}%
              </div>
            </div>
            <button v-bind:disabled="busy" class="float-left w-100 ml-1 mt-1 btn tag btn-outline-primary bg-white text-primary btn-lg" @click="tagImage(tags[0])">
              {{tags[0].name}}
            </button>
          </div>

          <div class="col-2 p-0">
            <button class="btn cam mb-1" @click="capture" v-bind:disabled="busy">
              <font-awesome icon="camera" class="fa-2x text-white"></font-awesome>
            </button>
          </div>

          <div class="col">
            <div class="progress right bg-secondary">
              <div v-bind:style="{ width: (tags[1].probability*100) + '%'}" ref="right" class="progress-bar bg-primary" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                {{tags[1].probabilityPercent}}%
              </div>
            </div>
            <button v-bind:disabled="busy" class="w-100 float-right mr-1 mt-1 btn tag btn-outline-primary bg-white text-primary btn-lg" @click="tagImage(tags[1])">
              {{tags[1].name}}
            </button>
          </div>
        </div>
      </slot>
    </cala-toolbar>
  </div>
</template>

<script>
  import images from "../../store/images";
  import Busy from "./Busy";
  import mathHelper from "../../utils/math";
  import Toolbar from "./Toolbar";
  import event from "./../../config/events.json";

  export default {
    name: "cala-stack",
    components: {
      "cala-busy": Busy,
      "cala-toolbar": Toolbar,
    },
    data() {
      return {
        images: [],
        busy: true,
        resourceUrl: this.$base + "api/cala/upload"
      };
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      },
    },
    computed: {
      hasImages: function() {
        return this.images.length > 0;
      },
      topMostImage() {
        return this.images[this.images.length - 1];
      },
      tags: {
        get() {
          return this.$store.state.tags.map((tag, index) => {
            // Animation direction, first tag to the left, second to the right.
            tag.animate = index === 0 ? "left" : "right";
            tag.probability = 0;
            tag.probabilityPercent = 0;
            return tag;
          });
        }
      }
    },
    methods: {
      capture() {
        this.$router.push({path: "/capture"});
      },
      tagImage(tag) {
        this.busy = true;

        this.$query(`
          mutation {
            tagImage(tagId: "${tag.id}", imageId: "${this.topMostImage.id}") {
              tagId
              imageId
            }
          }
        `).then(() => {
          this.$socket.emit(event.socket.broadcast.image.tagged, tag);
          //const className = "animated " + (tag.animate === "left" ? "bounceOutLeft" : "bounceOutRight");
          //this.images[this.images.length - 1].className = className;
          setTimeout(() => {
            this.images.pop();
            if (this.images.length === 0) {
              this.load();
            } else {
              this.predict();
            }
          }, 500);
        }).catch(error => {
          alert(error);
          this.busy = false;
        });
      },
      predict() {
        if (this.images.length === 0) {
          return;
        }

        images.predictUrl(this.topMostImage.imageUrl)
          .then(predictions => {
            this.tags.forEach(tag => {
              predictions.forEach(prediction => {
                if (tag.id === prediction.tag.id) {
                  tag.probability = prediction.probability;
                  tag.probabilityPercent = (prediction.probability * 100).toFixed(2);
                }
              })
            });
            this.busy = false;
          });
      },
      load() {
        this.busy = true;
        images.all({take: 10})
          .then(images => {
            this.images = images.reverse().map(this.mapImage);
            this.predict();
          })
          .catch(() => {
            this.busy = false;
          });
      },
      mapImage(image) {
        // Simulate random image stack.
        image.rot = mathHelper.randomInt(-5, 5);
        image.offsetX = mathHelper.randomInt(-50, 50);
        image.offsetY = mathHelper.randomInt(-10, 10) + (document.body.clientHeight / 8);
        // Used for animation.
        image.className = "";
        return image;
      }
    },
    mounted() {
      this.load();

      this.$socket.on(event.socket.broadcast.image.remove, image => {
        for (let i = 0; i < this.images.length; i += 1) {
          if (this.images[i].id === image.id) {
            this.images.splice(i, 1);
            break;
          }
        }
      });

      this.$socket.on(event.socket.broadcast.image.upload, image => this.mapImage(image));
    },
  }
</script>

<style scoped>
  img {
    width: 80%;
    height: auto;
    position: fixed;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10%;
    box-shadow: 0px 1px 1px 1px rgb(230, 230, 230);
    border-radius: 2px;
  }

  .btn.tag {
    font-weight: bold;
    box-shadow: 0 0 1px 0px white inset, 0px 0px 1px 2px white;
    border-radius: 5px;
  }

  .cam {
    border: 2px solid white;
    border-radius: 2em;
    padding: 0.5em;
  }

  .progress {
    position: fixed;
    bottom: 5.3em;
    width: 10em;
    border: none;
    border-radius: 2px;
  }

  .left {
    left: 0.7em;
  }

  .right {
    right: 0.7em;
  }

  .progress {
    height: 1.8em;
  }
</style>