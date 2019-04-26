<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <cala-meter v-bind:class="{hidden: busy}" ref="meter" v-bind:tags="tags"></cala-meter>

    <div class="cover rounded bg-secondary shadow-sm m-3" v-bind:style="{ 'background-image': 'url(' + cover + ')' }">
    </div>

    <div class="btn-group" id="group">
      <cala-upload url="/api/dashboard/upload" v-on:uploaded="done" @click="alert(1)"></cala-upload>
      <button @click="train" class="btn btn-success btn-lg">Retrain</button>
    </div>

    <cala-chart ref="chart" style="
 pointer-events: none;
    bottom: 0;
    height:38%;
    position: absolute;
    top: 52%;
    left: 1em;
    right: 1em;"></cala-chart>
  </div>
</template>

<style>
  .cover {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -1;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    height: 48%;
    top: 0;
  }

  .hidden {
    display: none;
  }

  #group {
    position: fixed;
    width: 50%;
    left: 0;
    right: 0;
    top: 50%;
    opacity: 0.7;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
</style>

<script>
  import calaUpload from "./cala-upload";
  import calaMeter from "./cala-meter";
  import calaBusy from "./cala-busy";
  import calaChart from "./cala-chart";

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
        busy: false,
        showMeter: false,
        cover: `/uploads/predict.jpg?fetch=${new Date().getTime()}`
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
        this.busy = true;
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
          });
      },
      done: function () {
        this.cover = `/uploads/predict.jpg?fetch=${new Date().getTime()}`;
        this.predict();
      },

      initSocket() {
        this.$socket.on('connect', () => {
          this.$log.debug("socket-connected");
        });

        this.$socket.on("count", (data) => {
          this.$log.debug(data);
        });

        this.$socket.on('disconnect', () => {
        });
      },
    },
    mounted: function () {
      this.initSocket();
      this.predict();
    }
  }
</script>
