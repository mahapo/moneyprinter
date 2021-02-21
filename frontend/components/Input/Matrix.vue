<template>
  <div>
    <v-row v-for="(input, index) in inputs" :key="input.key">
      <v-col cols="12" sm="6" md="2">
        <v-checkbox
          v-model="input.enabled"
          :label="input.name"
          dense
        ></v-checkbox>
      </v-col>
      <v-col cols="12" sm="6" md="2">
        <v-text-field v-model="input.start" dense label="Start"></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="2">
        <v-text-field
          v-model="input.end"
          dense
          label="End"
          :disabled="!input.enabled"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="2">
        <v-text-field
          v-model="input.step"
          dense
          label="Step"
          :disabled="!input.enabled"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">{{ formatedInputs[index].total }}</v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6" md="8"></v-col>
      <v-col cols="12" sm="6" md="4">
        <strong>Total tests: {{ totalTests }}</strong>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      inputs: [
        {
          name: 'Leverage',
          key: 'leverage',
          start: 70,
          end: 80,
          step: 10,
          enabled: false,
        },
        {
          name: 'Ratio',
          key: 'ratio',
          start: 2,
          end: 4,
          step: 0.5,
          enabled: false,
        },
        {
          name: 'Max Steps',
          key: 'maxSteps',
          start: 5,
          end: 8,
          step: 1,
          enabled: true,
        },
        {
          name: 'Recovery Dynamic add',
          key: 'recoveryGapDynamicAdd',
          start: 5,
          end: 15,
          step: 5,
          enabled: true,
        },
        {
          name: 'Recovery initial gap',
          key: 'recoveryGapInitial',
          start: 10,
          end: 40,
          step: 10,
          enabled: true,
        },
      ],
    }
  },
  computed: {
    formatedInputs() {
      return this.inputs.map((input) => {
        const steps = (input.end - input.start) / input.step + 1
        return {
          ...input,
          total: !input.enabled ? 1 : steps,
        }
      })
    },
    result() {
      return this.formatedInputs.map((input) => {
        if (input.enabled)
          try {
            return {
              key: input.key,
              steps: [...Array(input.total)].map((_step, index) =>
                parseFloat((input.start + input.step * index).toFixed(1))
              ),
            }
          } catch (error) {
            return {
              key: input.key,
              steps: [input.start],
            }
          }
        else
          return {
            key: input.key,
            steps: [input.start],
          }
      })
    },
    totalTests() {
      return this.result.reduce((total, result) => {
        return parseInt(total) * [...result.steps].length
      }, 1)
    },
  },
  watch: {
    result: {
      immediate: true,
      handler(newValue) {
        this.$emit('input', newValue)
      },
    },
  },
  methods: {},
}
</script>
