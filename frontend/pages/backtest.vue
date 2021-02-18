<template>
  <v-row>
    <v-col md="12">
      <v-card>
        <v-card-title class="headline">Strategy Backtester</v-card-title>
        <v-card-text>
          <ResultBalanceChart
            :balances="balances"
            :logarithmic="logarithmic"
          ></ResultBalanceChart>
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
          <v-tab> <v-icon left>mdi-account</v-icon>Settings </v-tab>
          <v-tab v-if="false"> <v-icon left>mdi-account</v-icon>Trades </v-tab>
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
                    <input-matrix v-model="testMatrix"></input-matrix>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col md="10">
                    <v-progress-linear
                      v-model="progress.percent"
                      height="36"
                      reactive
                    >
                      <template #default="{ value }">
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
          <v-tab-item v-if="false">
            <v-card flat>
              <v-card-text>
                <trade-table :trades="orders"></trade-table>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <result-table
                  :results="results"
                  @balances="balances = $event"
                ></result-table>
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { call } from 'vuex-pathify'
import { Matrix } from '@moneyprinter/utils'

export default {
  data() {
    return {
      logarithmic: false,
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
      results: [],
      balance: null,
      balances: [],
    }
  },
  async mounted() {
    // const ticks = await this.loadCSV('BTC/BTCUSD_Gemini_Q1_2020_prints.csv')
    // this.saveTicks(ticks)
    // this.ticks = await this.getSaveTicks()
    // console.log(this.ticks);
    // const result = await this.runBacktest(this.ticks)
    // console.log(result);
    // this.balances = result.balances
  },
  methods: {
    ...call('backtester/*'),
    async startBacktest() {
      // const result = await this.runBacktest(this.ticks)
      this.tab = 1
      const ticks = await this.getSaveTicks()
      let matrix = Matrix.createTestMatrix(this.testMatrix)
      for (const setting of matrix) {
        const result = await this.runBacktest({ setting, ticks })
        this.results.push(result)
        // const { balances, ...rest } = result
      }
    },
  },
}
</script>

<style></style>
