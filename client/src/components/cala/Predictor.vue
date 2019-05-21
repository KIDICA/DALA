<template>
  <div class="h-100">
    <cala-busy ref="busy"></cala-busy>

    <div class="row no-gutters">
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

            <div class="row mt-3" v-for="tag in tags" :key="tag.id">
              <div class="col">
                <small class="text-uppercase">{{tag.name}}</small>
                <button :key="tag.id" class="border-2 btn btn-block btn-lg border-white text-white" v-bind:class="tag.className">
                  {{tag.imageCount}}
                </button>
              </div>
            </div>

            <div class="row mt-3">
              <div class="col">
                <small class="text-uppercase">Unlabeled</small>
                <button class="btn-dark btn-lg border-2 border-white btn-block text-center">
                  <span class="font-weight-bold">{{imageCount-count.labeled}}</span>
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

    <div class="row mt-3">
      <div class="col">
        <span class="text-uppercase h4 font-weight-bold text-primary">Active Learning Session</span>
      </div>
    </div>

    <div class="row no-gutters mt-3" v-bind:style="{height: chartHeight}">
      <div class="col-3  mr-2">
        <div class="row">
          <div class="col">
            <div class="card h-100 border-0">
              <div class="card-body p-0">
                <img ref="image" class="h-100 shadow-sm mb-3 img-thumbnail shadow-sm cover-image" v-bind:src="cover"/>
                <cala-upload button-class="btn-block btn-outline-primary bg-white" url="/api/dashboard/upload" v-on:uploaded="update"></cala-upload>
                <button @click="train" class="mt-3 btn btn-block btn-secondary btn-lg">Retrain</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col">
        <div class="card h-100">
          <div class="card-body p-0">
            <cala-line-chart ref="chart"></cala-line-chart>

            <div class="position-absolute bg-white rounded-left rounded-right text-center"
                 style="bottom: 0; left: 40%; border-top-left-radius: .8em !important;border-top-right-radius: .8em !important; opacity: .9">
              <ul class="list-inline m-0 p-1">
                <li class="list-inline-item mr-2 ml-2 pb-0" v-for="tag in tags" :key="tag.id">
                  <span class="badge p-2 legend mr-3" style="border-radius: 2em" v-bind:class="tag.className">&nbsp;</span>
                  <span style="font-size: 1.3em;" class="font-weight-bolder">{{tag.name}}</span>
                </li>
              </ul>
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
        averagePrecision: 0,
      };
    },
    computed: {
      imageCount: {
        get() {
          return this.$store.state.imageCount;
        },
      },
      count: {
        get() {
          return this.$store.state.count;
        },
      },
      tags: {
        get() {
          const classNames = ["bg-success", "bg-primary"];
          const count = classNames.length;

          return this.$store.state.tags.map((tag, index) => {
            tag.className = classNames[index % count];
            return tag;
          });
        },
      },
      hasIterations: {
        get() {
          return this.$store.state.hasIterations;
        },
      },
    },
    watch: {
      busy(val) {
        this.$refs.busy.work = val;
      },
      hasIterations(val) {
        this.update();
      },
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
            this.update();
            this.busy = false;
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          });
      },
      resizeChart() {
        this.chartHeight = (document.body.clientHeight - 595) + "px";
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
            labels: ["Performance"],
          };
          this.busy = false;
        }).catch(error => {
          alert(error);
          this.busy = false;
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
              labels: new Array(series.length).fill(0).map((p, index) => "T-" + index),
            };

            this.resizeChart();

            this.busy = false;
          })
          .catch(error => {
            alert(error);
            this.busy = false;
          });
      },
      update() {
        if (this.hasIterations) {
          this.predict();
          this.performance();
        }
      },
    },
    mounted: function() {
      this.update();
      window.addEventListener("resize", this.resizeChart);
    },
  };
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