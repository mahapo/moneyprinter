<template>
  <ChartLine :chart-data="datacollection" :options="chartOptions"></ChartLine>
</template>

<script>
export default {
  props: {
    balances: {
      type: Array,
      default: () => [],
    },
    logarithmic: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        hover: {
          mode: 'nearest',
          intersect: true,
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              time: { displayFormats: { minute: 'HH:mm' } },
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Point',
              },
            },
          ],
          yAxes: [
            {
              display: true,
              type: this.logarithmic ? 'logarithmic' : 'linear',
              scaleLabel: {
                display: true,
                labelString: 'Value',
              },
              ticks: {
                suggestedMin: 0,
              },
            },
            // {
            //   id: 'drowdown',
            //   display: true,
            //   type: 'linear',
            //   position: 'right',
            //   ticks: {
            //     suggestedMin: -100,
            //     suggestedMax: 100,
            //   },
            // },
          ],
        },
      }
    },
    datacollection() {
      return {
        labels: this.balances.map((balance) => balance.time),
        datasets: [
          {
            label: 'Balance',
            borderColor: 'green',
            data: this.balances.map((balance) => balance.balance),
            fill: false,
            pointRadius: 0,
            steppedLine: true,
          },
          // {
          //   label: 'Drawdown',
          //   borderColor: 'green',
          //   data: this.balances.map((balance) => balance.drawdown),
          //   fill: false,
          //   pointRadius: 0,
          //   steppedLine: true,
          //   yAxisID: 'drowdown'
          // },
        ],
      }
    },
  },
}
</script>
