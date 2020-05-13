<template>
  <v-data-table dense :headers="header" :items="results" :items-per-page="50">
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
          text: 'Total Trades',
          value: 'positionsCount',
        },
        { text: 'Profit', value: 'profit' },
        { text: 'Balance Min', value: 'balanceMin' },
        { text: 'Balance Max', value: 'balanceMax' },
        { text: 'Max Step', value: 'countMax' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    }
  },
  methods: {
    startBacktest(options) {
      this.$socket.emit('backtestStart', {
        ...options,
        matrix: false,
      })
    },
  },
}
</script>

<style></style>
