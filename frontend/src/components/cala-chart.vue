<template>
  <div class="ct-chart" ref="chart"></div>
</template>

<script>
  import Chartist from "chartist";

  function randomData() {
    return {
      labels: new Array(5).fill(0).map((v, i) => "T-" + i),
      series: new Array(6).fill(0).map((v, i) => new Array(5).fill(0).map((e, i) => Math.random() * 100)),
    }
  }

  export default {
    name: "cala-chart",
    data() {
      return {
        data: {}
      }
    },
    watch: {
      data(val) {
        console.log(val);
        this.data.series = val.series;
        this.data.labels = val.labels;

        this.initChart({
          series: val.series,
          labels: val.labels
        });
      }
    },
    methods: {
      /**
       * @param {Number[]} param.series
       * @param {String[]} param.labels
       */
      initChart(param) {
        if (this.chart) {
          this.chart.detach();
          clearInterval(this.thread);
        }
        // Test random data
        this.thread = setInterval(() => {
          //this.chart.update(randomData())
        }, 5000);
        this.chart = new Chartist.Line('.ct-chart', {
          labels: param.labels,
          series: param.series,
        }, {
          low: 0,
          high: 100,
          showArea: true,
          showPoint: false,
          fullWidth: true
        });

        this.chart.on('draw', function (data) {
          if (data.type === 'line' || data.type === 'area') {
            data.element.animate({
              d: {
                begin: 3000 * data.index,
                dur: 3000,
                from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                to: data.path.clone().stringify(),
                easing: Chartist.Svg.Easing.easeOutQuint
              }
            });
          }
        });
      },
    },
    destroyed() {
      if (this.chart) {
        this.chart.detach();
        clearInterval(this.thread);
      }
    }
  }
</script>

<style>
  @import "~chartist/dist/chartist.min.css";

  .ct-series-a .ct-line, .ct-series-a .ct-point {
    stroke: green;
  }

  .ct-series-a .ct-area {
    fill: green;
  }

  .ct-series-b .ct-line,
  .ct-series-b .ct-point, .ct-series-b .ct-area {
    stroke: dodgerblue;
  }

  .ct-series-b .ct-area {
    fill: dodgerblue;
  }
</style>