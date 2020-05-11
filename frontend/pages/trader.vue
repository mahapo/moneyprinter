<template>
  <v-row>
    <v-col md="12">
      <v-card>
        <v-card-title class="headline">Bot</v-card-title>
        <v-card-text>
          <v-row>
            <v-col md="4">
              <v-text-field
                v-model="options.leverage"
                label="Leverage"
                type="number"
              ></v-text-field>
              <v-text-field
                v-model="options.ratio"
                label="Ratio"
                type="number"
              ></v-text-field>
              <strong>{{ tick }}</strong>
            </v-col>
            <v-col md="8">
              <Trade-Stepper
                :ratio="botOptions.ratio"
                :leverage="botOptions.leverage"
              ></Trade-Stepper>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="startBot">Start Bot</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col md="12">
      <v-card>
        <v-card-text>
          <v-data-table
            :headers="headersPosition"
            :items="positions"
            :items-per-page="20"
          ></v-data-table>
          <v-data-table
            :headers="headers"
            :items="orders"
            :items-per-page="20"
          ></v-data-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  sockets: {
    connect() {
      this.$socket.emit('orders', { symbol: 'BTCUSD' })
      this.$socket.emit('positions', { symbol: 'BTCUSD' })
    },
    // tick(tick) {
    //   this.tick = tick
    // },
    orders(orders) {
      this.orders = Array.from(orders)
    },
    positions(positions) {
      this.positions = Array.from(positions)
    },
  },
  data() {
    return {
      tick: 0,
      headers: [
        {
          text: 'ID',
          value: 'id',
        },
        {
          text: 'ID',
          value: 'info.order_link_id',
        },
        { text: 'Symbol', value: 'symbol' },
        { text: 'Side', value: 'side' },
        { text: 'amount', value: 'amount' },
        { text: 'Status', value: 'status' },
        { text: 'Type', value: 'type' },
        { text: 'Price', value: 'price' },
        { text: 'Filld', value: 'filled' },
        { text: 'Remaining', value: 'remaining' },
      ],
      headersPosition: [
        {
          text: 'ID',
          value: 'transactTimeNs',
        },
        { text: 'Symbol', value: 'symbol' },
        { text: 'Side', value: 'side' },
        { text: 'Pos', value: 'size' },
        { text: 'Entry Price', value: 'avgEntryPriceEp' },
        { text: 'Liquidation Price', value: 'liquidationPriceEp' },
        { text: 'markPriceEp', value: 'markPriceEp' },
        { text: 'curTermRealisedPnlEv', value: 'curTermRealisedPnlEv' },
        { text: 'cumClosedPnlEv', value: 'cumClosedPnlEv' },
        { text: 'unrealisedPnlEv:', value: 'unrealisedPnlEv' },
        { text: 'execSeq', value: 'execSeq' },
      ],
      orders: [],
      positions: [],
      options: {
        ratio: 2,
        leverage: 100,
      },
    }
  },
  computed: {
    botOptions() {
      return {
        ratio: parseInt(this.options.ratio),
        leverage: parseInt(this.options.leverage),
      }
    },
  },
  methods: {
    startBot() {
      this.$socket.emit('botStart', this.botOptions)
    },
  },
}
</script>

<style></style>
