<template>
  <div class="text-center">
    <canvas id="preview" ref="preview"></canvas>
    <button @click="capture" class="btn btn-primary btn-lg">Capture</button>
    <img ref="capture">
  </div>
</template>

<script>
  /**
   * @type {Object<string, HTMLElement>} $refs
   */
  export default {
    data() {
      return {};
    },
    methods: {
      capture() {
        this.$refs.preview.toBlob((blob) => {
          const urlCreator = window.URL || window.webkitURL;
          const imageUrl = urlCreator.createObjectURL(blob);
          this.$refs.capture.src = imageUrl;
        }, "image/jpeg", 0.8);
      },
      /**
       * @static
       * @param {HTMLCanvasElement} canvas
       * @param {ImageBitmap} img
       */
      drawCanvas(canvas, img) {
        canvas.width = getComputedStyle(canvas).width.split('px')[0];
        canvas.height = getComputedStyle(canvas).height.split('px')[0];
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * ratio) / 2;
        const y = (canvas.height - img.height * ratio) / 2;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, x, y, img.width * ratio, img.height * ratio);
      },
      /**
       * @param mediaStream
       */
      gotMedia(mediaStream) {
        this.track = mediaStream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(this.track);
        window.addEventListener("beforeunload", function () {
          mediaStream.getTracks().forEach(track => track.stop());
        });

        this.threadId = setInterval(() => {
          imageCapture.takePhoto()
            .then(blob => createImageBitmap(blob))
            .then(imageBitmap => {
              this.drawCanvas(this.$refs.preview, imageBitmap);
            }).catch(error => {
            //clearInterval(id);
            this.$log.error(error);
          });
        }, 3000);
      }
    },
    mounted() {
      try {
        const front = true;

        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: (front ? "user" : "environment")
          },

          // Hacky-ish way to retrieve the highest resolution.
          width: {min: 1024, ideal: 1920, max: 1920},
          height: {min: 768, ideal: 1080, max: 1080}
        }).then(result => {
          this.gotMedia(result);
        }).catch(error => {
          this.$log.error("getUserMedia()", error);
        });
      } catch (e) {
        alert("exception");
        this.$log.error(e.message);
      }
    },
    beforeRouteLeave(to, from, next) {
      clearInterval(this.threadId);
      this.track.stop();
      next();
    },
  }
</script>

<style scoped>
  #preview {
    padding: 1em;
    margin: 0;
    width: 100%;
    top: 0em;
    height: 20em;
  }
</style>