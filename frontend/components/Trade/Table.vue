<template>
  <v-data-table :headers="header" :items="trades" :items-per-page="20"></v-data-table>
</template>

<script>
export default {
  data() {
    return {
      header: [
        {
          text: 'Time',
          value: 'order.time',
        },
        // { text: 'Symbol', value: 'symbol' },
        { text: 'Side', value: 'order.side' },
        { text: 'Pos', value: 'order.size' },
        { text: 'Entry Price', value: 'order.price' },
        { text: 'Exit Price', value: 'exit' },
        { text: 'Profit', value: 'profit' },
        // { text: 'Liquidation Price', value: 'liquidationPriceEp' },
        // { text: 'markPriceEp', value: 'markPriceEp' },
        // { text: 'curTermRealisedPnlEv', value: 'curTermRealisedPnlEv' },
        // { text: 'cumClosedPnlEv', value: 'cumClosedPnlEv' },
        // { text: 'unrealisedPnlEv:', value: 'unrealisedPnlEv' },
        // { text: 'execSeq', value: 'execSeq' },
      ],
    }
  },
  props: {
    trades: {
      type: Array,
      default: ()=>[]
    }
  }
}
</script>

<style></style>
