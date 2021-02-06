<template>
  <v-row>
    <v-col md="12"> </v-col>
  </v-row>
</template>

<script>
import { call } from 'vuex-pathify'

export default {
  middleware: 'authenticated',
  async mounted() {
    try {
      await this.$store.dispatch('user/initSettings')
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
