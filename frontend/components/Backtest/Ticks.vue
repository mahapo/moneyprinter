<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="files"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:top>
        <v-btn color="primary" dark class="mb-2" @click="loadFiles()">
          Load Ticks
        </v-btn>
      </template>
      <template v-slot:item.use="{ item }">
        <v-simple-checkbox v-model="item.use"></v-simple-checkbox>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import sortBy from 'lodash/sortBy'

export default {
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      files: [],
      headers: [
        { text: 'Filename', value: 'name' },
        { text: 'Ticks', value: 'size' },
        { text: 'Start', value: 'start' },
        { text: 'End', value: 'end' },
        { text: 'Use', value: 'use', sortable: false },
      ],
    }
  },
  watch: {
    files: {
      immediate: true,
      handler(newValue) {
        this.$emit('input', newValue)
      },
    },
  },
  methods: {
    async loadFiles(dirHandle = null) {
      this.loading = true
      try {
        dirHandle ||= await window.showDirectoryPicker()
        for await (const fileHandle of dirHandle.values()) {
          if (fileHandle.kind === 'directory') await this.loadFiles(fileHandle)
          else if (fileHandle.kind === 'file') {
            if (fileHandle.name.endsWith('.csv')) {
              const file = await fileHandle.getFile()
              const content = await file.text()
              let ticks = this.csv2json(content)
              ticks = ticks.filter((tick) => !!tick.unix)
              ticks = sortBy(
                ticks.map((tick) => ({
                  time: parseInt(tick.unix),
                  price: parseFloat(tick.price),
                })),
                'timestamp'
              )
              this.files.push({
                name: fileHandle.name,
                size: ticks.length,
                start: this.$dayjs(ticks[0].time).format('YYYY/MM/DD'),
                end: this.$dayjs(ticks[ticks.length - 1].time).format(
                  'YYYY/MM/DD'
                ),
                ticks: ticks,
              })
            }
          }
        }
        this.loading = false
      } catch (error) {
        console.log(error)
      }
    },
    csv2json(data, delimiter = ',') {
      const titles = data.slice(0, data.indexOf('\n')).split(delimiter)
      const rows = data.slice(data.indexOf('\n') + 1).split('\n')
      return rows.map((row) => {
        const values = row.split(delimiter)
        return titles.reduce(
          (object, curr, i) => ((object[curr] = values[i]), object),
          {}
        )
      })
    },
  },
}
</script>

<style></style>
