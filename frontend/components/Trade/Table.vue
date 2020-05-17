<template>
  <v-data-table
    :headers="header"
    :items="trades"
    :items-per-page="20"
  ></v-data-table>
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
          value: 'timestamp',
        },
        // { text: 'Symbol', value: 'symbol' },
        { text: 'Side', value: 'side' },
        { text: 'Amount', value: 'amount' },
        { text: 'Entry Price', value: 'price' },
        { text: 'Exit Price', value: 'priceExit' },
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
}
</script>

<style></style>
