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
        }
        // Test random data
        this.chart = new Chartist.Line('.ct-chart',
          {
            labels: param.labels,
            series: param.series,
          },
          {
            width: "100%",
            height: "100%",
            low: 0,
            high: 100,
            axisY: {
              showGrid: false,
              showLabel: false,
            },
            axisX: {
              showGrid: true,
              showLabel: false,
            },
            showArea: true,
            showPoint: true,
            fullWidth: true,
            lineSmooth: true,
            chartPadding: {
              top: 5,
              right: 5,
              bottom: -25,
              left: -35
            },
          }
        );

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
      }
    }
  }
</script>

<style>
  @import "../../../node_modules/chartist/dist/chartist.min.css";

  .ct-series-a .ct-line, .ct-series-a .ct-point {
    stroke: #8ca528;
  }

  .ct-series-a .ct-area {
    fill: #8ca528;
  }

  .ct-series-b .ct-line,
  .ct-series-b .ct-point, .ct-series-b .ct-area {
    stroke: #ae0055;
  }

  .ct-series-b .ct-area {
    fill: #ae0055;
  }

  .ct-area {
    fill-opacity: 0.4;
  }
</style>