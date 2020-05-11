<template>
  <v-data-table
    :headers="header"
    :items="result"
    :items-per-page="20"
  ></v-data-table>
</template>

<script>
export default {
  props: {
    result: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      header: [
        {
          text: 'Total Trades',
          value: 'positionTotal',
        },
        { text: 'Start Balance', value: 'startBalance' },
        { text: 'End Balance', value: 'endBalance' },
        { text: 'Profit', value: 'profit' },
        { text: 'Profit (%)', value: 'profitPercent' },
        { text: 'Max ', value: 'maxCount' },
      ],
    }
  },
}
</script>

<style></style>
