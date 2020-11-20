<template>
  <ChartBar :chart-data="datacollection" :options="chartOptions"></ChartBar>
</template>

<script>
export default {
  props: {
    drawdowns: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    formatedData() {
      let lastBalance = null
      let lastChange = null
      return this.drawdowns
        .map((drawdown, index) => {
          if (!index) {
            lastBalance = drawdown.balance
            return drawdown
          }
          const change = 1 - (drawdown.balance / lastBalance) * 100
          lastBalance = drawdown.balance
          return { ...drawdown, change }
        })
        .map((drawdown, index) => {
          if (!index) {
            lastChange = drawdown.change
            return drawdown
          }
          const newdrawdown = drawdown.change + lastChange
          lastChange = drawdown.change
          return { ...drawdown, drawdown: newdrawdown }
        })
    },
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
        // scales: {
        //   xAxes: [
        //     {
        //       type: 'time',
        //       time: { displayFormats: { minute: 'HH:mm' } },
        //       display: true,
        //       scaleLabel: {
        //         display: true,
        //         labelString: 'Point',
        //       },
        //     },
        //   ],
        //   yAxes: [
        //     {
        //       display: true,
        //       type: 'linear',
        //       scaleLabel: {
        //         display: true,
        //         labelString: 'Value',
        //       },
        //       ticks: {
        //         suggestedMin: 0,
        //       },
        //     },
        //   ],
        // },
      }
    },
    datacollection() {
      return {
        labels: this.formatedData.map((drawdown) => drawdown.timestamp),
        datasets: [
          {
            label: 'Balance',
            borderColor: 'green',
            data: this.formatedData.map((drawdown) => drawdown.change),
            pointRadius: 0,
          },
          {
            label: 'Balance',
            borderColor: 'green',
            data: this.formatedData.map((drawdown) => drawdown.drawdown),
            pointRadius: 0,
          },
        ],
      }
    },
  },
}
</script>
