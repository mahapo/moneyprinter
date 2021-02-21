<template>
  <v-data-table
    dense
    :headers="header"
    :items="filteredResults"
    :items-per-page="100"
    multi-sort
    @click:row="handleClick"
  >
    <template #top>
      <v-switch
        v-model="good"
        label="Show only good results"
        class="pa-3"
      ></v-switch>
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    results: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      header: [
        {
          text: 'Symbol',
          value: 'options.symbol',
        },
        {
          text: 'Leverage',
          value: 'options.leverage',
        },
        {
          text: 'Ratio',
          value: 'options.ratio',
        },
        {
          text: 'Risk',
          value: 'options.risk',
        },
        {
          text: 'Max Steps',
          value: 'options.maxSteps',
        },
        {
          text: 'Percent Of max range',
          value: 'options.recoveryGapInitial',
        },
        {
          text: 'Total Trades',
          value: 'ordersCount',
        },
        {
          text: 'Win Trades (in row)',
          value: 'countWin',
        },
        {
          text: 'Loss Trades (in row)',
          value: 'countLoss',
        },
        { text: 'Profit (%)', value: 'profitPercent' },
        { text: 'Profit per Day', value: 'profitPercentPerDay' },
        // { text: 'Balance Min', value: 'balanceMin' },
        // { text: 'Balance Max', value: 'balanceMax' },
        // { text: 'Max Drawdown (%)', value: 'drawdownMax' },
        // { text: 'Min Amount', value: 'amountMin' },
        // { text: 'Max Amount', value: 'amountMax' },
      ],
      good: false,
    }
  },
  computed: {
    filteredResults() {
      return this.results.filter(
        (result) => !this.good || (result.balanceMin > 0 && result.profit > 0)
      )
    },
  },
  methods: {
    async handleClick(value) {
      try {
        if (value.balances) {
          this.$emit('balances', value.balances)
          return
        }
        const { docs } = await this.$fire.firestore
          .collection(`backtesting/${value.id}/balances`)
          .get()
        let { balances } = docs[0].data()
        if (balances) {
          // Quick fix
          balances = balances.map((balance) => {
            return { ...balance }
          })
          console.table(balances)
          this.$emit('balances', balances)
        }
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style></style>
