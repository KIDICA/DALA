<template>
  <div class="h-100">
    <cala-busy ref="busy"></cala-busy>

    <div class="row no-gutters">
      <div class="col  mr-2">
        <div class="card h-100 border-0">
          <div class="card-header text-primary bg-transparent pt-0 pr-0 pl-0 border-0 pb-2">
            <span class="text-uppercase h4 font-weight-bold">Active Learning Session</span>
          </div>
          <div class="card-body p-0">
            <img ref="image" class="img-thumbnail shadow-sm h-100 cover-image" v-bind:src="cover">
          </div>
        </div>
      </div>

      <div class="col mr-2">
        <div class="card bg-light h-100 border-light">
          <div class="card-header font-weight-bold text-white bg-light border-0">
            <span class="text-uppercase h4">Overall Stats</span>
          </div>
          <div class="card-body p-3">
            <div class="row">
              <div class="col">
                <small class="text-uppercase">Images Uploaded:</small>
                <button class="btn-outline-primary border-2 bg-white btn-lg btn-block text-center">
                  <span class="font-weight-bold">{{imageCount}}</span>
                </button>
              </div>
            </div>

            <div class="row mt-2" v-for="tag in tags" :key="tag.id">
              <div class="col">
                <small class="text-uppercase">{{tag.name}}</small>
                <button :key="tag.id" class="border-2 btn btn-block btn-lg border-white text-white" v-bind:class="tag.className">
                  {{tag.imageCount}}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- col -->

      <div class="col">
        <div class="card bg-light h-100 border-light">
          <div class="card-header font-weight-bold text-white bg-light border-0">
            <span class="text-uppercase h4">Average Precision</span>
          </div>
          <div class="card-body text-center">
            <cala-pie-chart ref="performance"></cala-pie-chart>
            <span class="text-secondary font-weight-bolder display-4">
              {{(averagePrecision*100).toFixed(2)}}%
            </span>
          </div>
        </div>
      </div>

    </div>

    <div class="row mt-4">
      <div class="col">
        <ul class="list-inline float-right">
          <li class="list-inline-item mr-5" v-for="tag in tags" :key="tag.id">
            <span class="badge p-2 legend mr-1" style="border-radius: 2em" v-bind:class="tag.className">&nbsp;</span>
            <span style="font-size: 1.3em;" class="font-weight-bolder">{{tag.name}}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="row p-0 mt-2" v-bind:style="{height: chartHeight}">
      <div class="col">

        <div class="card h-100">
          <div class="card-body p-0">
            <cala-line-chart ref="chart"></cala-line-chart>
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
  import Busy from "./Busy";
  import LineChart from "./LineChart";
  import PieChart from "./PieChart";

  export default {
    name: "cala-dashboard",
    components: {
      "cala-upload": Upload,
      "cala-busy": Busy,
      "cala-line-chart": LineChart,
      "cala-pie-chart": PieChart,
    },
    data: function() {
      return {
        hasCover: true,
        cover: this.$base + `uploads/predict.jpg?fetch=${new Date().getTime()}`,
        busy: false,
        predictions: [],
        chartHeight: "5em",
        averagePrecision: 0
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
        }`)
          .then(result => {
            this.$log.debug(result);
            this.predict();
            this.busy = false;
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          });
      },
      resizeChart() {
        this.chartHeight = (document.body.clientHeight - 515) + "px";
      },
      performance() {
        this.busy = true;
        this.$query(`
          {
            performance {
              precision
              recall
              averagePrecision

              perTagPerformance {
                id
                name
                precision
                recall
                averagePrecision
              }
            }
          }
        `).then(result => {
          this.averagePrecision = result.performance.averagePrecision;
          this.$refs.performance.data = {
            series: [result.performance.averagePrecision * 100],
            labels: ["Performance"]
          };
          this.busy = false;
        }).catch(error => {
          alert(error);
          this.busy = false;
        })
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
            // Don't use the result.predictions directly, the Babel-compiler/WebPack/Whatnot
            // I assume messes up the value and becomes undefined. Insanity.
            const preds = result.predictions;
            this.cover = this.$base + `uploads/predict.jpg?fetch=${new Date().getTime()}`;

            this.hasCover = true;

            // We know based on the order of the tags in which they are
            // displayed and which graph belongs to which tag (and color).
            const series = [];
            this.tags.forEach(tag => {
              const result = preds.map(p => p.predictions.filter(p2 => p2.tag.id === tag.id)[0].probability * 100);
              series.push([0].concat(result));
            });

            this.$refs.chart.data = {
              series: series,
              labels: new Array(series.length).fill(0).map((p, index) => "T-" + index)
            };

            this.resizeChart();

            this.busy = false;
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          });
      },
      done() {
        this.predict();
        this.performance();
      }
    },
    mounted: function() {
      this.predict();
      this.performance();
      window.addEventListener('resize', this.resizeChart);
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