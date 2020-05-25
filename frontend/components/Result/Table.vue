<template>
  <v-data-table dense :headers="header" :items="filteredResults" :items-per-page="50">
    <template v-slot:top>
      <v-switch v-model="good" label="Show only good results" class="pa-3"></v-switch>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon small @click="startBacktest(item.options)">mdi-run</v-icon>
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
        { text: 'Profit', value: 'profit' },
        { text: 'Balance Min', value: 'balanceMin' },
        { text: 'Balance Max', value: 'balanceMax' },
        { text: 'Max Drawdown (%)', value: 'drawdownMax' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      good: true,
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
    startBacktest(options) {
      this.$socket.client.emit('startBacktest', {
        ...options,
        matrix: false,
      })
    },
  },
}
</script>

<style></style>
