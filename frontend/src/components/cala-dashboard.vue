<template>
  <div class="m-2">
    <cala-busy ref="busy"></cala-busy>

    <div class="card">
      <div class="card-header p-2">
        <strong>Prediction</strong>
      </div>
      <div class="card-body p-3">
        <div class="row">
          <div class="col">
            <cala-meter v-if="hasCover" v-bind:class="{hidden: busy}" ref="meter" v-bind:tags="tags"></cala-meter>
          </div>
        </div>

        <hr/>

        <div class="row">
          <div class="col">
            <img style="height: 15em; width: auto;" class="img-thumbnail" v-bind:src="cover">
          </div>
        </div>

        <div class="row mt-2">
          <div class="col text-center">
            <div class="btn-group" id="group">
              <cala-upload url="/api/dashboard/upload" v-on:uploaded="done"></cala-upload>
              <button @click="train" class="btn btn-success">Retrain</button>
            </div>
          </div>
        </div>

        <div class="row p-0 mt-2">
            <cala-chart ref="chart" style="width: 95%"></cala-chart>
        </div>

      </div>
    </div>
  </div>
</template>

<style>
  .cover {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    height: 48%;
  }

  .hidden {
    display: none;
  }
</style>

<script>
  import calaUpload from "./cala-upload";
  import calaMeter from "./cala-meter";
  import calaBusy from "./cala-busy";
  import calaChart from "./cala-chart";

  function imageExists(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  }

  export default {
    name: "cala-dashboard",
    components: {
      "cala-upload": calaUpload,
      "cala-meter": calaMeter,
      "cala-busy": calaBusy,
      "cala-chart": calaChart
    },
    data: function () {
      return {
        hasCover: false,
        busy: false,
        showMeter: false,
        cover: ""
      };
    },
    computed: {
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
      busy(val) {
        this.$refs.busy.work = val;
      }
    },
    methods: {
      train() {
        this.busy = true;
        this.$query(`{
        train {id}
          iterations {id, name, status, created}
        }`).then(result => {
          this.$log.debug(result);
          setTimeout(() => {
            this.predict();
          }, 1000);
        });
      },
      predict() {
        const cover = this.$base + `uploads/predict.jpg?fetch=${new Date().getTime()}`;
        this.busy = true;
        this.hasCover = true;
        this.$query(`
          {
            predictions(file: "predict.jpg") {
              iterationId
              created
              predictions {
                tag {
                  id
                  name
                }
                probability
              }
            }
          }`)
          .then(result => {
            this.cover = cover;
            if (result.predictions === null) {
              this.busy = false;
              return;
            }
            this.showMeter = true;
            const tags = {};

            result.predictions.forEach(pred => {
              pred.predictions.forEach(p => {
                if (!tags[p.tag.name]) {
                  tags[p.tag.name] = [];
                }
                tags[p.tag.name].push(p.probability * 100);
              });
            });

            this.tags = result.predictions[0].predictions.map(p => {
              return {name: p.tag.name, value: p.probability * 100}
            });

            const arrays = Object.keys(tags)
              .map(key => {
                return [0].concat(tags[key].reverse())
              });

            this.$refs.chart.data = {
              series: arrays,
              labels: new Array(arrays[0].length).fill(0).map((p, index) => "T-" + index)
            };

            this.busy = false;
          }).catch(response => {
          this.busy = false;
        })
      },
      done: function () {
        this.predict();
      },

      initSocket() {
        this.$socket.on("connect", () => {
          this.$log.debug("socket-connected");
        });

        this.$socket.on("count", (data) => {
          this.$log.debug(data);
        });

        this.$socket.on("disconnect", () => {
        });
      },
    },
    mounted: function () {
      this.initSocket();
      this.predict();
    }
  }
</script>
