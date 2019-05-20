<template>
  <div ref="chart" class="ct-chart"></div>
</template>

<script>
  import Chartist from "chartist";

  export default {
    name: "cala-pie-chart",
    data() {
      return {
        data: {
          series: [],
          labels: []
        }
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
        this.chart = Chartist.Pie(this.$refs.chart, {
          labels: param.labels,
          series: param.series,
        }, {
          total: 100,
          width: "100%",
          height: "100%",
          donut: true,
          donutWidth: 30,
          showLabel: false
        });

        this.chart.on('draw', function(data) {
          if (data.type === 'slice') {
            // Get the total path length in order to use for dash array animation
            const pathLength = data.element._node.getTotalLength();

            // Set a dasharray that matches the path length as prerequisite to animate dashoffset
            data.element.attr({
              'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
            });

            // Create animation definition while also assigning an ID to the animation for later sync usage
            var animationDefinition = {
              'stroke-dashoffset': {
                id: 'anim' + data.index,
                dur: 1000,
                from: -pathLength + 'px',
                to: '0px',
                easing: Chartist.Svg.Easing.easeOutQuint,
                // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
                fill: 'freeze'
              }
            };

            // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
            if (data.index !== 0) {
              animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
            }

            // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
            data.element.attr({
              'stroke-dashoffset': -pathLength + 'px'
            });

            // We can't use guided mode as the animations need to rely on setting begin manually
            // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
            data.element.animate(animationDefinition, false);
          }
        });

        // For the sake of the example we update the chart every time it's created with a delay of 8 seconds
        this.chart.on('created', () => {
          if (window.__anim21278907124) {
            clearTimeout(window.__anim21278907124);
            window.__anim21278907124 = null;
          }
          window.__anim21278907124 = setTimeout(() => this.chart.update(), 10000);
        });
      },
    },
    mounted() {
      this.initChart(this.data);
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

  .ct-series-a .ct-slice-donut {
    stroke: #ae0055;
  }

  .ct-series-b .ct-slice-donut {
    stroke: #8ca528;
  }
</style>