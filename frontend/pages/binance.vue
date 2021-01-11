<template>
  <v-row>
    <v-col md="12"> </v-col>
  </v-row>
</template>

<script>
export default {
  middleware: 'auth',
  async mounted() {
    try {
      await this.$store.dispatch('binance/bindCountDocument')
    } catch (e) {
      console.error(e)
    }
  },
}
</script>

<style></style>
