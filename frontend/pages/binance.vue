<template>
  <v-row>
    <v-col md="12"> </v-col>
  </v-row>
</template>

<script>
import { call, get } from 'vuex-pathify'

export default {
  middleware: 'authenticated',
  computed: {
    ...get('binance/*'),
  },
  async mounted() {
    try {
      await this.$store.dispatch('user/initSettings')
      await this.$store.dispatch('binance/initMarkets')
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    // wire multiple actions
    ...call('user/*'),
  },
}
</script>

<style></style>
