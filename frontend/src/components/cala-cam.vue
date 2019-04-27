<template>
  <div class="text-center h-100">
    <cala-busy ref="busy"></cala-busy>

    <div class="alert alert-info" v-bind:class="{ 'hidden' : !notify, 'slideInDown animated' : notify }" style="position: absolute; top:0; z-index: 1000; opacity: 0.9; left:1em; right:1em;">
      {{message}}
    </div>

    <video ref="cam" id="preview" autoplay="true"></video>

    <cala-overlay>
      <button v-bind:disabled="busy" @click="capture" class="btn btn-success btn-lg">
        <i class="fa fa-camera"></i> Capture
      </button>
    </cala-overlay>

    <img style="display: none" ref="capture">

    <form style="display: none" ref="form" method="post" enctype="multipart/form-data">
      <input ref="inputFile" name="file" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
    </form>
  </div>
</template>

<script>
  import CameraPhoto, { FACING_MODES, IMAGE_TYPES } from 'jslib-html5-camera-photo';
  import Overlay from "./cala-overlay";
  import Busy from "./cala-busy";

  /**
   * @See https://stackoverflow.com/questions/12168909/blob-from-dataurl
   * @param dataURI
   * @returns {Blob}
   */
  function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    const ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    const blob = new Blob([ab], {type: mimeString});
    return blob;
  }

  export default {
    name: "cala-cam",
    components: {
      "cala-overlay": Overlay,
      "cala-busy": Busy
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      },
      message(val) {
        this.message = val;
        this.notify = true;
        setTimeout(() => {
          this.notify = false;
        }, 2000);
      }
    },
    data() {
      return {
        notify: false,
        message: "Saved!",
        busy: false,
        resourceUrl: this.$base + "api/cala/upload"
      };
    },
    methods: {
      capture() {
        this.audio.play();

        this.busy = true;
        const config = {
          sizeFactor: 1,
          imageType: IMAGE_TYPES.JPG,
          imageCompression: .95,
          isImageMirror: false,
        };

        const dataUri = this.cameraPhoto.getDataUri(config);
        const blob = dataURItoBlob(dataUri);
        this.upload(blob)
          .then(() => {
            this.busy = false;
            this.message = "Saved.";
          });
        // Display preview if necessary.
        // this.$refs.capture.src = dataUri;
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
      }
    },
    mounted() {
      this.audio = new Audio("sound/camera.mp3");
      this.cameraPhoto = new CameraPhoto(this.$refs.cam);
      this.cameraPhoto.startCameraMaxResolution(FACING_MODES.ENVIRONMENT)
        .then((stream) => {/* ... */
        })
        .catch((error) => {/* ... */
        });
    },
    beforeRouteLeave(to, from, next) {
      this.cameraPhoto.stopCamera()
        .then(() => {
          console.log('Camera stoped!');
          next();
        })
        .catch((error) => {
          console.log('No camera to stop!:', error);
          next();
        });
    },
  }
</script>

<style scoped>
  #preview {
    left: 0;
    right: 0;
    padding: 0;
    margin: 0;
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>