<template>
  <v-row>
    <v-col md="12">
      <v-card>
        <v-card-title class="headline">Strategy Backtester</v-card-title>
        <v-card-text>
          <ResultBalanceChart :balances="balances" :logarithmic="logarithmic"></ResultBalanceChart>
          <v-switch v-model="logarithmic" :label="`Logarithmic`"></v-switch>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col md="12">
      <v-card>
        <v-tabs v-model="tab">
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
                <v-row>
                  <v-col cols="12">
                    <v-select
                      v-show="false"
                      v-model="testOptions.strategy"
                      :items="strategies"
                      label="Strategy"
                    ></v-select>
                    <v-select v-model="testOptions.file" :items="files" label="Testfile"></v-select>
                    <v-text-field
                      v-model="testOptions.startBalance"
                      label="Startbalance"
                      type="number"
                    ></v-text-field>
                  </v-col>
                  <v-col v-if="false" cols="12">
                    <v-text-field v-model="testOptions.leverage" label="Leverage" type="number"></v-text-field>
                    <v-text-field v-model="testOptions.ratio" label="Ratio" type="number"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <input-matrix v-model="testMatrix"></input-matrix>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col md="10">
                    <v-progress-linear v-model="progress.percent" height="36" reactive>
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
                <trade-table :trades="orders"></trade-table>
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
    files(files) {
      if (!this.files.length) this.files = Array.from(files)
    },
    ticks(ticks) {
      this.ticks = ticks
    },
    backtestFinish({ orders, balances }) {
      this.orders = orders
      this.balances = balances
        .sort(function (a, b) {
          return new Date(a.timestamp) - new Date(b.timestamp)
        })
        .filter((balance) => !!balance.timestamp)
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
      logarithmic: true,
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
        file: './data/trades/BTCUSDT_August2019_January2020.csv',
        ratio: 2,
        leverage: 100,
        startBalance: 100,
        risk: 100,
        maxSteps: 5,
        percentOfMaxRange: 80,
      },
      progress: {
        percent: 0,
        text: 'Start test',
      },
      orders: [],
      balances: [],
    }
  },
  mounted() {
    this.$socket.client.emit('files')
  },
  methods: {
    startBacktest() {
      this.results = []
      this.tab = 2
      let symbol

      if (this.testOptions.file.includes("BTCUSDT")) symbol = "BTC/USD"

      this.$socket.client.emit('startBacktesthMatrix', {
        ...this.testOptions,
        symbol,
        matrix: this.testMatrix,
      })
    },
  },
}
</script>

<style></style>
