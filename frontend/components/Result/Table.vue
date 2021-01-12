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
          value: 'options.percentOfMaxRange',
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
        { text: 'Profit (%)', value: 'profitPecent' },
        { text: 'Profit per Day', value: 'profitPecentPerDay' },
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
      return [...this.results].filter(
        (result) => !this.good || (result.balanceMin > 0 && result.profit > 0)
      )
    },
  },
  methods: {
    async handleClick(value) {
      const results = await value.balances.get()
      const { balances } = results.data()
      console.log(balances)
      this.$emit('balances', balances)
    },
  },
}
</script>

<style></style>
