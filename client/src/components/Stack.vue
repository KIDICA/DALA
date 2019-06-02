<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <div class="row">
      <div class="col">
        <div ref="detection" v-show="predicted" class="alert alert-primary position-absolute text-center p-2 rounded-0 border-0" style="opacity: 0.7;top: 4.45em;left: 0%;right: 0%; z-index: 1000;">
          <span v-if="!detected">I'm still not sure about this...</span>
          <span v-if="detected">I think it is a {{detection.name}}! {{detection.probabilityPercent}}%</span>
        </div>
      </div>
    </div>

    <div v-if="!(busy || hasImages)" class="overflow-hidden text-center image-container vcenter">
      <span style="margin-left: auto; margin-right: auto" class="display-4 text-primary">
        No data yet.
      </span>
    </div>

    <div ref="container" class="overflow-hidden text-center image-container vcenter">
      <div class="image" v-bind:data-index="index" v-for="(image, index) in images" :key="image.id" v-bind:style="{transform: 'rotate(' + image.rot + 'deg) translateX(' + image.offsetX + 'px)' , zIndex: 3*index}">
        <img v-bind:src="image.thumbnailUrl" class="img-thumbnail" v-bind:style="{zIndex: 3*index+1}"/>
        <button @click="destroyImage(image)" class="btn position-absolute" style="right: 12%;" v-bind:style="{zIndex: 3*index+2}">
          <font-awesome icon="times" class="display-4 text-primary"></font-awesome>
        </button>
      </div>
    </div>

    <cala-toolbar v-if="tags.length>0">
      <slot>
        <div class="row">
          <div class="col">
            <div v-show="predicted" class="alert alert-primary position-absolute p-2 rounded-0 border-0" style="opacity: 0.7;bottom: 0em;left: 0%;right: 0%; margin-bottom: 0.5em;">
              What is it?
            </div>
          </div>
        </div>
        <div class="row">
          <div class="float-left col">
            <div class="progress left bg-transparent" v-if="renderProgress">
              <div v-bind:style="{ width: (tags[0].probabilityPercent) + '%'}" class="progress-bar bg-success" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <span class="text-dark pl-2 pr-2">{{tags[0].probabilityPercent}}%</span>
              </div>
            </div>
            <button ref="leftButton" v-bind:disabled="busy" v-bind:class="{'btn-secondary': tagged.left, 'btn-outline-primary bg-white text-primary ': !tagged.left}" class="float-left w-100 ml-1 mt-1 btn tag btn-lg" @click="tagImage(tags[0])">
              {{tags[0].name}}
              <font-awesome v-if="tagged.left" icon="check"></font-awesome>
            </button>
          </div>

          <div class="col-2 p-0">
            <button class="btn cam mb-1" @click="capture" v-bind:disabled="busy">
              <font-awesome icon="camera" class="fa-2x text-white"></font-awesome>
            </button>
          </div>

          <div class="col">
            <div class="progress right bg-transparent" style="direction: rtl" v-if="renderProgress">
              <div v-bind:style="{ width: (tags[1].probabilityPercent) + '%'}" ref="right" class="progress-bar bg-primary" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <span class=" pl-2 pr-2 text-white" v-if="tags[1].probability>0.3">{{tags[1].probabilityPercent}}%</span>
                <span class=" pl-2 pr-2 text-dark" v-if="tags[1].probability<=0.3">{{tags[1].probabilityPercent}}%</span>
              </div>
            </div>
            <button ref="rightButton" v-bind:disabled="busy" v-bind:class="{'btn-secondary': tagged.right, 'btn-outline-primary bg-white text-primary ': !tagged.right}" class="w-100 float-right mr-1 mt-1 btn tag btn-lg" @click="tagImage(tags[1])">
              {{tags[1].name}}
              <font-awesome v-if="tagged.right" icon="check"></font-awesome>
            </button>
          </div>
        </div>
      </slot>
    </cala-toolbar>
  </div>
</template>

<script>
  import imageStore from "../store/images";
  import Busy from "./Busy";
  import mathHelper from "../utils/math";
  import Toolbar from "./Toolbar";
  import event from "../config/events.json";
  import Hammer from "hammerjs";
  import animation from "../utils/animation";

  export default {
    name: "cala-stack",
    components: {
      "cala-busy": Busy,
      "cala-toolbar": Toolbar,
    },
    data() {
      return {
        tagged: {
          left: false,
          right: false,
        },
        predicted: false,
        renderProgress: false,
        images: [],
        busyVal: true,
        detected: false,
        minProbability: 0.5,
        detection: {name: "", probability: 0},
        resourceUrl: this.$base + "api/cala/upload",
      };
    },
    watch: {
      $route() {
        this.manager.destroy();
      },
      images() {
        this.predict();
      },
    },
    computed: {
      hasImages: {
        get() {
          return this.images.length > 0;
        },
      },
      busy: {
        set(val) {
          this.busyVal = val;
          this.$refs.busy.work = val;
        },
        get() {
          return this.busyVal;
        },
      },
      topMostImage() {
        return this.images[this.images.length - 1];
      },
      voidTag: {
        get() {
          return this.$store.state.voidTag;
        },
      },
      tags: {
        get() {
          return this.$store.state.tags.map((tag, index) => {
            tag.position = index === 0 ? "left" : "right";
            tag.probability = 0;
            tag.probabilityPercent = 0;
            return tag;
          });
        },
      },
      ap: {
        get() {
          return this.$store.state.performance.averagePrecision;
        },
      },
    },
    methods: {
      destroyImage(image) {
        if (!window.confirm("Delete snapshot?")) {
          return;
        }
        this.busy = true;
        imageStore.destroy(image)
          .then(() => {
            this.$socket.emit(event.socket.broadcast.image.remove, image);
            setTimeout(() => this.images.splice(this.images.indexOf(image), 1), 700);
            this.busy = false;
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          });
      },
      capture() {
        this.$router.push({path: "/capture"});
      },
      /**
       * @param {{id: String, position: String}} tag
       */
      tagImage(tag) {
        if (this.busy) {
          return;
        }
        this.busy = true;
        this.tagged[tag.position] = true;

        this.$query(`
          mutation {
            tagImage(tagId: "${tag.id}", imageId: "${this.topMostImage.id}") {
              tagId
              imageId
            }
          }
        `).then(() => {
          this.tagged[tag.position] = true;
          animation.pulse(this.$refs[tag.position + "Button"], {duration: 2000});

          this.$socket.emit(event.socket.broadcast.image.tagged, {tag, image: this.topMostImage});
          setTimeout(() => {
            this.tagged[tag.position] = false;
            animation.slideOut(this.$refs.container.lastChild, {duration: 800, direction: tag.position});
            setTimeout(() => {
              this.images.pop();
              if (this.images.length === 0) {
                this.load();
              } else {
                this.predict();
              }
            }, 800);
          }, 500);
        }).catch(error => {
          alert(error);
          this.busy = false;
        });
      },
      predict() {
        this.predicted = false;
        if (this.images.length === 0) {
          return;
        }

        imageStore.predictUrl(this.topMostImage.imageUrl)
          .then(predictions => {
            this.tags.forEach(tag => {
              predictions.forEach(prediction => {
                if (tag.id === prediction.tag.id) {
                  tag.probability = prediction.probability;
                  tag.probabilityPercent = (prediction.probability * 100).toFixed(2);
                  if (tag.probability > this.detection.probability) {
                    this.detection = tag;
                  }
                }
              });
            });
            this.detected = this.detection.probability >= this.minProbability;
            this.predicted = true;
            setTimeout(() => animation.pulse(this.$refs.detection), 500);
          });
      },
      load() {
        this.busy = true;
        imageStore.all({type: "untagged", take: 10})
          .then(images => {
            this.images = images.reverse().map(this.mapImage);
            this.busy = false;
          })
          .catch(() => {
            this.busy = false;
          });
      },
      mapImage(image) {
        // Simulate random image stack.
        image.rot = mathHelper.randomInt(-4, 4);
        image.offsetX = mathHelper.randomInt(-20, 20);
        image.width = document.body.clientWidth * 0.7;
        image.offsetY = document.body.clientHeight / 2 - ((document.body.clientHeight * .55) / 2);

        return image;
      },
      listen() {
        this.$socket.on(event.socket.broadcast.image.remove, image => {
          for (let i = 0; i < this.images.length; i += 1) {
            if (this.images[i].id === image.id) {
              this.images.splice(i, 1);
              break;
            }
          }
        });
      },
      touch() {
        this.manager = new Hammer.Manager(this.$refs.container, {
          recognizers: [[Hammer.Swipe, {direction: Hammer.DIRECTION_HORIZONTAL}]],
        });
        const Swipe = new Hammer.Swipe();
        this.manager.add(Swipe);

        this.manager.on("swipe", (e) => {
          const direction = e.offsetDirection;

          if (direction === Hammer.DIRECTION_LEFT) {
            this.tagImage(this.tags[0]);
          } else if (direction === Hammer.DIRECTION_RIGHT) {
            this.tagImage(this.tags[1]);
          }
        });
      },
    },
    mounted() {
      this.load();
      this.touch();
      this.listen();
      this.$store.watch(state => state.snapshots, image => this.mapImage(image));
    },
  };
</script>

<style scoped>
  .image {
    position: fixed;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    width: 85%;
    max-height: 65%;
  }

  .image img {
    box-shadow: 0px 1px 5px 1px rgb(182, 182, 182);
    border-radius: 2px;
    height: auto;
    width: 80%;
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

  .progress-bar span {
    min-width: 5rem;
  }

  .vcenter {
    display: flex;
    align-items: center;
    min-height: 95vh;
  }
</style>