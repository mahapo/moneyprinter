<template>
  <v-data-table
    v-model="selected"
    :headers="headers"
    :items="formatedInputs"
    item-key="name"
    show-select
  ></v-data-table>
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
      singleSelect: false,
      selected: [],
      headers: [
        {
          text: 'Input',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        { text: 'Start', value: 'start' },
        { text: 'End', value: 'end' },
        { text: 'Step', value: 'step' },
        { text: 'Tests', value: 'total' },
      ],
      inputs: [
        {
          name: 'Leverage',
          key: 'leverage',
          start: 50,
          end: 100,
          step: 10,
        },
        {
          name: 'Ratio',
          key: 'ratio',
          start: 2,
          end: 4,
          step: 0.2,
        },
        {
          name: 'Risk',
          key: 'risk',
          start: 50,
          end: 200,
          step: 10,
        },
        {
          name: 'Max Steps',
          key: 'maxSteps',
          start: 2,
          end: 9,
          step: 1,
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
          total: steps,
        }
      })
    },
    result() {
      return this.selected.map((input) => {
        return {
          key: input.key,
          steps: [...Array(input.total)].map((_step, index) =>
            parseFloat((input.start + input.step * index).toFixed(1))
          ),
        }
      })
    },
  },
  watch: {
    result(newValue) {
      this.$emit('input', newValue)
    },
  },
}
</script>
