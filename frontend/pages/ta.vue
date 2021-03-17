<template>
  <v-data-table dense :headers="header" :items="ta" :items-per-page="100">
    <template v-slot:top>
      <v-row>
        <v-col cols="6">
          <v-combobox
            v-model="timesSelected"
            :items="times"
            label="Time"
            multiple
            outlined
            dense
          ></v-combobox>
        </v-col>
        <v-col cols="6">
          <v-combobox
            v-model="indicatorsSelected"
            :items="indicators"
            label="Time"
            multiple
            outlined
            dense
          ></v-combobox>
        </v-col>
      </v-row>
    </template>
  </v-data-table>
</template>

<script>
export default {
  data() {
    return {
      ta: [],
      times: ['5m', '15m', '30m', '1h', '4h'],
      timesSelected: ['5m', '15m', '30m', '1h', '4h'],
      indicators: ['rvoi', 'rsi'],
      indicatorsSelected: ['rvoi', 'rsi'],
    }
  },
  computed: {
    header() {
      const header = this.indicatorsSelected.map((i) =>
        this.timesSelected.map((time) => ({
          text: `${i} ${time}`,
          value: `${time}.${i}`,
        }))
      )

      return [
        {
          text: 'Symbol',
          value: 'symbol',
        },
        ...header.flat(),
      ]
    },
  },
  async mounted() {
    const { docs } = await this.$fire.firestore.collection('ta').get()
    this.ta = docs.map((doc) => {
      return {
        symbol: doc.id,
        ...doc.data(),
      }
    })
  },
  methods: {
    getColor(calories) {
      if (calories > 400) return 'red'
      else if (calories > 200) return 'orange'
      else return 'green'
    },
  },
}
</script>
