<template>
  <div class="h-100">
    <cala-busy ref="busy"></cala-busy>

    <form style="display: none" ref="form" method="post" enctype="multipart/form-data">
      <input ref="inputFile" name="file" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
    </form>

    <div class="h-100 w-100 align-middle" style="position: relative" v-show="!showCamPreview">
      <img
          v-bind:src="image.thumbnailUrl"
          v-bind:class="'img-thumbnail ' + image.className"
          v-bind:style="{transform: 'rotate(' + image.rot + 'deg) translateX(' + image.offsetX + 'px) translateY(' + image.offsetY + 'px)' , zIndex: index}"
          v-for="(image, index) in images"
          :key="image.id"/>
    </div>

    <video v-show="showCamPreview" ref="cam" id="preview" class="bg-light" autoplay="true" playsInline></video>

    <div class="fixed-bottom w-100 bg-light pt-2 pl-1 pr-1 pb-1 text-center align-middle" v-if="tags.length>0">
      <div class="row">
        <div class="float-left col">
          <div class="progress left bg-secondary" v-show="!showCamPreview">
            <div v-bind:style="{ width: (tags[0].probability*100) + '%'}" class="progress-bar bg-success" role="progressbar" ref="left" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
              {{tags[0].probabilityPercent}}%
            </div>
          </div>
          <button v-show="!showCamPreview" v-bind:disabled="busy||showCamPreview" class="float-left w-100 ml-1 mt-1 btn tag btn-outline-primary bg-white text-primary btn-lg" @click="tagImage(tags[0])">
            {{tags[0].name}}
          </button>
        </div>

        <div class="col-2 p-0">
          <button class="btn cam mb-1" @click="capture" v-bind:disabled="busy">
            <font-awesome icon="camera" class="fa-2x text-white"></font-awesome>
          </button>
        </div>

        <div class="col">
          <div class="progress right bg-secondary" v-show="!showCamPreview">
            <div v-bind:style="{ width: (tags[1].probability*100) + '%'}" ref="right" class="progress-bar bg-primary" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
              {{tags[1].probabilityPercent}}%
            </div>
          </div>
          <button v-show="!showCamPreview" v-bind:disabled="busy||showCamPreview" class="w-100 float-right mr-1 mt-1 btn tag btn-outline-primary bg-white text-primary btn-lg" @click="tagImage(tags[1])">
            {{tags[1].name}}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import images from "../../store/images";
  import Busy from "./Busy";
  import CameraPhoto, {FACING_MODES, IMAGE_TYPES} from 'jslib-html5-camera-photo';
  import imageHelper from "../../utils/image";
  import mathHelper from "../../utils/math";

  export default {
    name: "cala-stack",
    components: {
      "cala-busy": Busy
    },
    data() {
      return {
        images: [],
        busy: true,
        camStarted: false,
        showCamPreview: false,
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
        if (!this.camStarted) {
          this.cameraPhoto.startCameraMaxResolution(FACING_MODES.ENVIRONMENT)
            .then(stream => {
              this.$log.debug("Camera started");
              this.camStarted = true;
              this.showCamPreview = true;
            })
            .catch(error => {
              alert(error);
              this.$log.error(error);
            });
          return;
        }
        if (this.showCamPreview) {
          this.startCapture();
        }
        this.showCamPreview = true;
      },
      startCapture() {
        this.busy = true;

        const settings = this.cameraPhoto.getCameraSettings();
        settings.imageType = IMAGE_TYPES.JPG;
        settings.imageCompression = 0.80;

        //this.audio.play();
        const dataUri = this.cameraPhoto.getDataUri(settings);
        const blob = imageHelper.dataURItoBlob(dataUri);
        this.upload(blob)
          .then(response => {
            const image = response.data;
            this.$socket.emit("image-upload", image);
            this.images.push(this.mapImage(image));
            this.busy = false;
            this.message = "Saved.";
            this.showCamPreview = false;
          })
          .catch(error => {
            this.busy = false;
            this.$log.error(error);
            this.showCamPreview = false;
          });
      },
      upload(file) {
        return new Promise((resolve, reject) => {
          const formData = new FormData(this.$refs.form);
          formData.append('file', file, "file.jpg");

          this.$http.post(this.resourceUrl, formData)
            .then(response => {
              resolve(response);
            })
            .catch(error => {
              this.$log.error(error);
              reject(error);
            });
        });
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
          this.$socket.emit("tag-image", tag);
          const className = "animated " + (tag.animate === "left" ? "bounceOutLeft" : "bounceOutRight");
          this.images[this.images.length - 1].className = className;
          setTimeout(() => {
            this.images.pop();
            if (this.images.length === 0) {
              this.load();
            } else {
              this.predict();
            }
          }, 500);
        })
          .catch(error => {
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
        image.offsetY = mathHelper.randomInt(-10, 10);
        // Used for animation.
        image.className = "";
        return image;
      }
    },
    mounted() {
      this.audio = new Audio("sound/camera.mp3");
      this.audio.load();
      this.cameraPhoto = new CameraPhoto(this.$refs.cam);
      this.load();

      this.$socket.on("broadcast-image-delete", image => {
        for (let i = 0; i < this.images.length; i += 1) {
          if (this.images[i].id === image.id) {
            this.images.splice(i, 1);
            break;
          }
        }
      });
    },
    beforeRouteLeave(to, from, next) {
      if (this.camStarted) {
        this.cameraPhoto.stopCamera()
          .then(() => {
            this.$log.debug('Camera stoped!');
            next();
          })
          .catch((error) => {
            this.$log.error('No camera to stop!:', error);
            next();
          });
      } else {
        next();
      }
    },
  }
</script>

<style scoped>
  img {
    width: 66%;
    height: auto;
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10%;
    box-shadow: 0px 1px 1px 1px rgb(230, 230, 230);
    border-radius: 2px;
  }

  #preview {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    padding: 0;
    position: fixed;
    width: auto;
    height: 90%;
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