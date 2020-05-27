<template>
  <v-data-table :headers="header" :items="trades" :items-per-page="20"></v-data-table>
</template>

<script>
export default {
  props: {
    trades: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      header: [
        {
          text: 'Time',
          value: 'timestampFilled',
        },
        {
          text: 'Time Exit',
          value: 'timestampExit',
        },
        // { text: 'Symbol', value: 'symbol' },
        { text: 'Side', value: 'side' },
        { text: 'Amount', value: 'amount' },
        { text: 'Entry Price', value: 'price' },
        { text: 'Exit Price', value: 'priceExit' },
        { text: 'Profit', value: 'profit' },
        { text: 'Takeprofit', value: 'takeProfit' },
        { text: 'StopLoss', value: 'stopLoss' },
      ],
    }
  },
}
</script>

<style></style>
