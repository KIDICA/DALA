<template>
  <div>
    <cala-busy ref="busy"></cala-busy>

    <div class="row" v-if="false">
      <div class="col">
        <cala-meter v-if="hasCover" v-bind:class="{hidden: busy}" ref="meter" v-bind:tags="localTags"></cala-meter>
      </div>
    </div>

    <div class="row">
      <div class="col-5">
        <img ref="image" class="img-thumbnail shadow-sm cover-image" v-bind:src="cover">
      </div>

      <div class="col">
        <div class="row">
          <div class="col">
            <small class="text-uppercase">Images Uploaded:</small>
            <button disabled style="opacity: .5" class="btn-outline-primary btn-lg btn-block text-center bg-transparent">
              {{imageCount}}
            </button>
          </div>
        </div>

        <div class="row mt-2">
          <template v-for="tag in tags" :key="tag.id">
            <div class="col">
              <small class="text-uppercase">{{tag.name}}</small>
              <button :key="tag.id" class="btn btn-block btn-lg text-white" v-bind:class="tag.className">
                {{tag.imageCount}}
              </button>
            </div>
          </template>
        </div>

        <ul class="list-inline float-right mr-3" style="bottom: 0; position: absolute; right: 0;">
          <li class="list-inline-item mr-5" v-for="tag in tags" :key="tag.id">
            <span class="badge p-2 legend mr-1" style="border-radius: 2em" v-bind:class="tag.className">&nbsp;</span>
            <span style="font-size: 1.3em;" class="font-weight-bolder">{{tag.name}}</span>
          </li>
        </ul>

      </div> <!-- col -->

    </div>

    <div class="row p-0 mt-2">
      <div class="col">

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <cala-chart ref="chart" style="width: 100%;" v-bind:style="{height: chartHeight}"></cala-chart>
            <div class="btn-group" style="position: absolute; right:1em; bottom:1em;">
              <cala-upload url="/api/dashboard/upload" v-on:uploaded="done"></cala-upload>
              <button @click="train" class="btn btn-outline-primary btn-lg bg-white">Retrain</button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
  import Upload from "./Upload";
  import Meter from "./Meter";
  import Budy from "./Busy";
  import Chart from "./Chart";

  export default {
    name: "cala-dashboard",
    components: {
      "cala-upload": Upload,
      "cala-meter": Meter,
      "cala-busy": Budy,
      "cala-chart": Chart
    },
    data: function () {
      return {
        hasCover: true,
        cover: this.$base + `uploads/predict.jpg?fetch=${new Date().getTime()}`,
        busy: false,
        showMeter: false,
        predictions: [],
        chartHeight: "5em"
      };
    },
    computed: {
      imageCount: {
        get() {
          return this.$store.state.imageCount;
        }
      },
      tags: {
        get() {
          const classNames = ["bg-success", "bg-primary"];
          const count = classNames.length;

          return this.$store.state.tags.map((tag, index) => {
            tag.className = classNames[index % count];
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
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          })
      },
      resizeChart() {
        this.chartHeight = (document.body.clientHeight - this.$refs.image.clientHeight - 120) + "px";
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
            if (result.predictions === null) {
              this.busy = false;
              return;
            }
            this.cover = this.$base + `uploads/predict.jpg?fetch=${new Date().getTime()}`;

            this.hasCover = true;
            this.showMeter = true;
            // Group predictions by tag
            const predictionsByTag = {};

            const oldToNew = result.predictions.sort((p1, p2) => parseInt(p1.created) - parseInt(p2.created));
            oldToNew.forEach(p => {
              p.predictions.forEach(p => {
                if (!predictionsByTag[p.tag.name]) {
                  // Predictions start at 0 to show the progression better.
                  predictionsByTag[p.tag.name] = [0];
                }
                predictionsByTag[p.tag.name].push(p.probability * 100);
              });
            });

            // We know based on the order of the tags in which they are
            // displayed and which graph belongs to which tag (and color).
            const series = [];
            this.tags.forEach(tag => series.push(predictionsByTag[tag.name]));

            this.$refs.chart.data = {
              series: series,
              labels: new Array(series.length).fill(0).map((p, index) => "T-" + index)
            };

            this.resizeChart();

            this.busy = false;
          })
          .catch(error => {
            this.busy = false;
          });
      },
      done() {
        this.predict();
      }
    },
    mounted: function () {
      this.predict();
      window.onresize = () => {
        this.resizeChart();
      };
    }
  }
</script>

<style scoped>
  .legend {
    border-radius: 2em;
    width: 2em;
    height: 2em;
  }

  .cover {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    height: 48%;
  }

  .cover-image {
    height: 25em;
    width: 100%;
    object-fit: contain;
  }

  .hidden {
    display: none;
  }

  .small, small {
    font-size: 90%;
    margin-bottom: 0.4em;
  }
</style>