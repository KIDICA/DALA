<template>
  <div class="text-center h-100">
    <cala-busy ref="busy"></cala-busy>

    <div id="sidebar" class="bg-light">
      <img @click="view(image)" v-for="image in snapshots" :key="image.id" v-bind:src="image.thumbnailUri" class="rounded animated bounceIn"/>
    </div>

    <div class="alert alert-info" v-bind:class="{ 'hidden' : !notify, 'slideInDown animated' : notify }" style="position: absolute; top:0; z-index: 1000; opacity: 0.9; left:1em; right:1em;">
      {{message}}
    </div>

    <video ref="cam" id="preview" class="bg-light" autoplay></video>

    <cala-overlay>
      <button v-bind:disabled="busy" @click="capture" class="btn btn-success btn-lg">
        <font-awesome icon="camera"></font-awesome>
        Capture
      </button>
    </cala-overlay>

    <img style="display: none" ref="capture">

    <form style="display: none" ref="form" method="post" enctype="multipart/form-data">
      <input ref="inputFile" name="file" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
    </form>
  </div>
</template>

<script>
  import CameraPhoto, {FACING_MODES, IMAGE_TYPES} from 'jslib-html5-camera-photo';
  import Overlay from "./Overlay";
  import Busy from "./Busy";
  import clientDb from "../../store/client";

  /**
   * TODO: Move to static module and test.
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
      },
    },
    data() {
      return {
        snapshots: [],
        notify: false,
        message: "Saved!",
        busy: false,
        resourceUrl: this.$base + "api/cala/upload"
      };
    },
    methods: {
      view(image) {
        alert(image.id);
      },
      storeSnapshot(value) {
        clientDb.snapshots.add(value)
          .then(() => {
            this.snapshots.unshift(value);
          });
      },
      capture() {
        this.audio.play();

        this.busy = true;
        const config = {
          sizeFactor: 1,
          imageType: IMAGE_TYPES.JPG,
          imageCompression: 0.80,
          isImageMirror: false,
        };

        const dataUri = this.cameraPhoto.getDataUri(config);
        const blob = dataURItoBlob(dataUri);

        this.upload(blob)
          .then(response => {
            const image = response.data.result;
            image.created = Date.now();
            //this.storeSnapshot(image);
            this.busy = false;
            this.message = "Saved.";
          })
          .catch(error => {
            this.$log.error(error);
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
    created() {
      clientDb.snapshots
        .orderBy("created").reverse()
        .toArray()
        .then(snapshots => {
          this.snapshots = snapshots;
          //snapshots.forEach(image => alert(JSON.stringify(image)));
        });
    },
    mounted() {
      this.audio = new Audio("sound/camera.mp3");
      this.cameraPhoto = new CameraPhoto(this.$refs.cam);
      this.cameraPhoto.startCameraMaxResolution(FACING_MODES.ENVIRONMENT);
      //.then((stream) => {/* ... */
      //})
      //.catch((error) => {/* ... */
      //});
    },
    beforeRouteLeave(to, from, next) {
      this.cameraPhoto.stopCamera()
        .then(() => {
          this.$log.debug('Camera stoped!');
          next();
        })
        .catch((error) => {
          this.$log.error('No camera to stop!:', error);
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
    position: fixed;
    width: 85%;
    height: 90%;
  }

  #sidebar {
    position: fixed;
    z-index: 10;
    right: 0;
    width: 15%;
    height: 100%;
    top: 0;
    bottom: 0;
    margin-top: 5.2em;
    padding-left: 2px;
    padding-right: 2px;
    overflow-y: scroll;
  }

  #sidebar img {
    padding: 2px;
    width: 100%;
    height: 50px;
    margin-bottom: 2px;
  }
</style>