<template>
  <v-row>
    <v-col md="12">
      <v-card>
        <v-card-title class="headline">Strategy Backtester</v-card-title>
        <v-card-text>
          <chart-line
            :chart-data="datacollection"
            :options="chartOptions"
          ></chart-line>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col md="12">
      <v-card>
        <v-tabs v-model="tab">
          <v-tab> <v-icon left>mdi-account</v-icon>Settings </v-tab>
          <v-tab> <v-icon left>mdi-account</v-icon>Trades </v-tab>
          <v-tab> <v-icon left>mdi-money</v-icon>Results </v-tab>

          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-select
                      v-show="false"
                      v-model="testOptions.strategy"
                      :items="strategies"
                      label="Strategy"
                    ></v-select>
                    <v-select
                      v-model="testOptions.file"
                      :items="files"
                      label="Testfile"
                    ></v-select>
                    <v-text-field
                      v-model="testOptions.startBalance"
                      label="Startbalance"
                      type="number"
                    ></v-text-field>
                  </v-col>
                  <v-col v-if="false" cols="12">
                    <v-text-field
                      v-model="testOptions.leverage"
                      label="Leverage"
                      type="number"
                    ></v-text-field>
                    <v-text-field
                      v-model="testOptions.ratio"
                      label="Ratio"
                      type="number"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <input-table v-model="testMatrix"></input-table>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col md="10">
                    <v-progress-linear
                      v-model="progress.percent"
                      height="36"
                      reactive
                    >
                      <template v-slot="{ value }">
                        {{ progress.text }}:
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
                <result-table :results="results"></result-table>
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
    test(data) {
      console.log(data)
    },
    files(files) {
      this.files = Array.from(files)
    },
    ticks(ticks) {
      this.ticks = ticks
    },
    backtestFinish({ positions, balances }) {
      balances = balances
        .sort(function (a, b) {
          return new Date(a.time) - new Date(b.time)
        })
        .filter((balance) => !!balance.time)
      const labels = balances.map((balance) => balance.time)
      this.positions = positions

      this.datacollection = {
        labels,
        datasets: [
          {
            label: 'Balance',
            borderColor: 'green',
            data: balances.map((balance) => balance.balance),
            fill: false,
            pointRadius: 0,
          },
        ],
      }
    },
    backtestFinishMatrix(update) {
      this.results.push(update)
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
      tab: 0,
      strategies: [
        {
          text: 'Moneyprinter',
          value: 'moneyprinter',
        },
      ],
      ticks: [],
      testMatrix: [],
      files: [],
      results: [],
      testOptions: {
        strategy: 'moneyprinter',
        file: './data/BTCUSD_Test_Prints.csv',
        ratio: 2,
        leverage: 100,
        startBalance: 100,
        risk: 100,
        maxSteps: 10,
      },
      progress: {
        percent: 0,
        text: 'Start test',
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
  mounted() {
    this.$socket.client.emit('files')
  },
  methods: {
    startBacktest() {
      this.results = []
      this.tab = 2
      this.$socket.client.emit('startBacktesthMatrix', {
        ...this.testOptions,
        matrix: this.testMatrix,
      })
    },
  },
}
</script>

<style></style>
