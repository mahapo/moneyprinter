<template>
  <v-layout column justify-center>
    <v-flex xs12 sm12 md12>
      <v-card>
        <v-card-title class="headline"
          >Welcome to the Vuetify + Nuxt.js template</v-card-title
        >
        <v-card-text>
          <chart-line
            :chart-data="datacollection"
            :options="options"
          ></chart-line>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="startBacktest">Continue</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  sockets: {
    finish({ startBalance, positions }) {
      positions = positions.sort(function (a, b) {
        return new Date(a.order.time) - new Date(b.order.time)
      })
      let balance = startBalance
      const balances = positions.map(({ profit }) => {
        balance += profit
        return balance
      })
      const labels = positions.map(({ order }) => new Date(order.time))

      this.datacollection = {
        labels,
        datasets: [{
            label: 'Balance',
            backgroundColor: 'green',
            borderColor: 'green',
            data: balances,
            fill: false,
            pointRadius: 0,
          }]
      }
    },
  },
  data() {
    return {
      datacollection: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
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
              scaleLabel: {
                display: true,
                labelString: 'Value',
              },
              ticks: {
                suggestedMin: 0,
              },
            },
          ],
        },
      },
    }
  },
  methods: {
    startBacktest() {
      this.$socket.emit('backtest', { symbol: 'BTCUSD' })
    },
  },
}
</script>

<style></style>
