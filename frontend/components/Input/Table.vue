<template>
  <v-data-table
    v-model="selected"
    :headers="headers"
    :items="formatedInputs"
    item-key="name"
    show-select
    dense
    hide-default-footer
  >
    <template v-slot:top>
      <v-toolbar flat color="white">
        <v-toolbar-title>TestMatrix</v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" max-width="500px">
          <v-card>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.start"
                      label="Start"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.end"
                      label="End"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.step"
                      label="Step"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
    </template>
    <template v-slot:body.append>
      <tr>
        <td colspan="5"></td>
        <td>
          <strong>{{ totalTests }} Tests</strong>
        </td>
      </tr>
    </template>
  </v-data-table>
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
      dialog: false,
      singleSelect: false,
      selected: [],
      editedIndex: -1,
      editedItem: {},
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
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      inputs: [
        {
          name: 'Leverage',
          key: 'leverage',
          start: 30,
          end: 50,
          step: 5,
        },
        {
          name: 'Ratio',
          key: 'ratio',
          start: 3,
          end: 5,
          step: 0.5,
        },
        {
          name: 'Risk',
          key: 'risk',
          start: 40,
          end: 100,
          step: 20,
        },
        {
          name: 'Max Steps',
          key: 'maxSteps',
          start: 4,
          end: 10,
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
    totalTests() {
      return this.result.reduce((total, result) => {
        return parseInt(total) * [...result.steps].length
      }, 1)
    },
  },
  watch: {
    result(newValue) {
      this.$emit('input', newValue)
    },
  },
  methods: {
    editItem(item) {
      this.editedIndex = this.formatedInputs.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },
    close() {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },

    save() {
      if (this.editedIndex > -1) {
        Object.assign(this.inputs[this.editedIndex], this.editedItem)
      } else {
        this.inputs.push(this.editedItem)
      }
      this.close()
    },
  },
}
</script>
