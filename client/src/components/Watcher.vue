<template>
  <div class="align-middle align-content-center">
    <span v-show="!paused&&guess!==''" class="position-fixed p-2 rounded-bottom text-primary bg-white display-4 text-center" style="top:0; left:0; right:0; opacity: 0.5; z-index: 1000">{{guess}}</span>
    <form style="display: none" ref="form" method="post" enctype="multipart/form-data">
      <input ref="inputFile" name="file" type="file" accept="image/jpeg,image/jpg,image/png;capture=camera">
    </form>

    <video ref="cam" class="bg-light" autoplay="true" playsInline></video>
    <canvas style="z-index: 100; left:0; bottom: 0; right:0;" class="position-fixed" ref="chart" v-bind:width="width" v-bind:height="height"></canvas>

    <button class="btn btn-primary position-fixed btn-lg" style="bottom: 5%; right: 5%; z-index: 1000;">
      <font-awesome icon="pause" v-show="!paused" @click="paused=true"/>
      <font-awesome icon="play" v-show="paused" @click="paused=false"/>
    </button>
  </div>
</template>

<script>
  import CameraPhoto, {FACING_MODES, IMAGE_TYPES} from "jslib-html5-camera-photo";
  import imageHelper from "../utils/image";
  import {TimeSeries, SmoothieChart} from "smoothie";

  export default {
    name: "cala-capture",
    data() {
      return {
        paused: false,
        resourceUrl: this.$base + "api/cala/predict",
        busy: false,
        guess: "",
        width: document.body.clientWidth,
        height: document.body.clientHeight * 0.33,
      };
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      },
    },
    methods: {
      capture(callback) {
        const settings = this.cameraPhoto.getCameraSettings();
        settings.imageType = IMAGE_TYPES.JPG;
        settings.imageCompression = 0.40;
        settings.sizeFactor = 0.4;

        const dataUri = this.cameraPhoto.getDataUri(settings);
        const blob = imageHelper.dataURItoBlob(dataUri);

        this.upload(blob)
          .then(response => {
            callback(response);
          })
          .catch(error => {
            this.$log.error(error);
            clearInterval(this.threadId);
            alert(error);
            setTimeout(() => this.$router.go(-1), 1500);
          });
      },
      start() {
        const series1 = new TimeSeries();
        series1.minValue = 0;
        series1.maxValue = 110;

        const series2 = new TimeSeries();
        series2.minValue = 0;
        series2.maxValue = 110;

        const canvas = this.$refs.chart;

        const chart = new SmoothieChart({limitFPS: 30, grid: {millisPerLine: 0, verticalSections: 1, borderVisible: false, fillStyle: 'rgba(255, 255, 255, .35)'}});

        chart.addTimeSeries(series1,
          {strokeStyle: 'rgb(174, 0, 85)', fillStyle: 'rgba(174, 0, 85, 0.4)', lineWidth: 3});
        chart.addTimeSeries(series2,
          {strokeStyle: 'rgb(140, 165, 40)', fillStyle: 'rgba(140, 165, 40, 0.4)', lineWidth: 3});

        chart.streamTo(canvas, 1000);

        this.threadId = setInterval(() => {
          if (this.paused) {
            return;
          }
          this.capture((data) => {
            const ps = data.sort((a, b) => b.probability - a.probability);
            if (ps.length > 0 && ps[0].probability > 0.5) {
              this.guess = `${ps[0].tagName} ${(ps[0].probability * 100).toFixed(1)}%`;
            } else {
              this.guess = "No guess yet."
            }
            series1.append(Date.now(), data[0].probability * 100);
            series2.append(Date.now(), data[1].probability * 100);
          });
        }, 1000);
      },
      upload(file) {
        return new Promise((resolve, reject) => {
          const formData = new FormData(this.$refs.form);
          formData.append("file", file, "file.jpg");

          this.$http.post(this.resourceUrl, formData)
            .then(response => {
              resolve(response.data);
            })
            .catch(error => {
              this.$log.error(error);
              reject(error);
            });
        });
      },
    },
    mounted() {
      this.cameraPhoto = new CameraPhoto(this.$refs.cam);

      this.cameraPhoto.startCameraMaxResolution(FACING_MODES.ENVIRONMENT)
        .then(stream => {
          this.$log.debug("Camera started");
          this.start();
        })
        .catch(error => {
          alert(error);
          this.$log.error(error);
        });
    },
    beforeRouteLeave(to, from, next) {
      this.cameraPhoto.stopCamera()
        .then(() => {
          this.$log.debug("Camera stopped");
          next();
        })
        .catch((error) => {
          this.$log.error("No camera to stop:", error);
          next();
        });
    },
  };
</script>

<style scoped>
  video {
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    position: fixed;
    width: 100%;
    height: auto;
    max-height: 100%;
  }

  .cam {
    border: 2px solid;
    border-radius: 2em;
    padding: 0.5em;
  }
</style>