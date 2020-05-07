<template>
  <v-row>
    <v-col md="12">
      <v-card>
        <v-card-title class="headline">Strategy Backtester</v-card-title>
        <v-card-text>
          <chart-line :chart-data="datacollection" :options="chartOptions"></chart-line>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col md="12">
      <v-card>
        <v-tabs>
          <v-tab>
            <v-icon left>mdi-account</v-icon>Settings
          </v-tab>
          <v-tab>
            <v-icon left>mdi-account</v-icon>Trades
          </v-tab>
          <v-tab>
            <v-icon left>mdi-money</v-icon>Results
          </v-tab>

          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <v-row v-if="false">
                  <v-col cols="6">
                    <v-select v-model="testOptions.strategy" :items="strategies" label="Strategy"></v-select>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="6">
                    <v-select v-model="testOptions.strategy" :items="strategies" label="Strategy"></v-select>
                    <v-select v-model="testOptions.file" :items="files" label="Testfile"></v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      label="Startbalance"
                      v-model="testOptions.startBalance"
                      type="number"
                    ></v-text-field>
                    <v-text-field label="Leverage" v-model="testOptions.leverage" type="number"></v-text-field>
                    <v-text-field label="Ratio" v-model="testOptions.ratio" type="number"></v-text-field>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col md="10">
                    <v-progress-linear v-model="progress.percent" height="36" reactive>
                      <template v-slot="{ value }">
                        {{progress.text}}:
                        <strong>{{ value }}%</strong>
                      </template>
                    </v-progress-linear>
                  </v-col>
                  <v-col md="2">
                    <v-btn color="primary" @click="startBacktest">Start</v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <trade-table :trades="positions"></trade-table>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <result-table :result="result"></result-table>
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  sockets: {
    files(files) {
      this.files = Array.from(files)
    },
    backtestFinish({ startBalance, positions, profit, maxCount }) {

      positions = positions.sort(function (a, b) {
        return new Date(a.order.time) - new Date(b.order.time)
      })
      let balance = startBalance
      const balances = positions.map(({ profit }) => {
        balance += profit
        return balance
      })
      const labels = positions.map(({ order }) => new Date(order.time))
      this.positions = positions

            this.result = [{
        positionTotal: positions.length,
        startBalance,
        endBalance: balance,
        profit,
        maxCount
      }]

      this.datacollection = {
        labels,
        datasets: [
          {
            label: 'Balance',
            backgroundColor: 'green',
            borderColor: 'green',
            data: balances,
            fill: false,
            pointRadius: 0,
          },
        ],
      }
    },
    backtestUpdate(update) {
      this.progress = {
        ...this.progress,
        ...update,
      }
    },
  },
  data() {
    return {
      strategies: [
        {
          text: 'Moneyprinter',
          value: 'moneyprinter'
        },
      ],
      files: [],
      result:[],
      testOptions: {
        strategy: 'moneyprinter',
        file: '',
        startBalance: 400,
        leverage: 100,
        ratio: 3,
      },
      progress: {
        percent: 0,
        text: "Start test"
      },
      positions: [],
      datacollection: {
        labels: [],
        datasets: [],
      },
      chartOptions: {
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
      this.$socket.emit('backtestStart', this.testOptions)
    },
  },
}
</script>

<style></style>
