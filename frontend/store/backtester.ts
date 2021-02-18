import { make } from 'vuex-pathify'
import { Backtester } from '@moneyprinter/runners'
import Dexie from 'dexie';

interface Tick {
  id?: number;
  timestamp?: number;
  price?: number;
}

//
// Declare Database
//
class TickDatabase extends Dexie {
  public ticks: Dexie.Table<Tick, number>; // id is number in this case

  public constructor() {
      super("TickDatabase");
      this.version(1).stores({
        ticks: "++id, timestamp, price"
      });
      this.ticks = this.table("ticks");
  }
}

const db = new TickDatabase();

export const state = () => ({})

export const getters = make.getters(state)
export const mutations = make.mutations(state)
export const actions = {
  ...make.actions(state),
  async loadCSV({ dispatch }, filePath) {
    // @ts-ignore
    const storageRef = this.$fire.storage.ref()

    try {
      const url = await storageRef.child(filePath).getDownloadURL()
      console.log(url)
      // @ts-ignore
      const { data } = await this.$axios.get(url)
      const ticks = await dispatch('csv2json', { data })
      return ticks.map((tick) => ({
        timestamp: parseInt(tick.unix),
        price: parseFloat(tick.price),
      }))
    } catch (error) {
      console.error(error)
    }
  },
  csv2json({}, { data, delimiter = ',' }) {
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
  async getSaveTicks() {
    return await db.ticks.toArray()
  },
  async saveTicks(_, ticks: Tick[]) {
    try {
      await db.ticks.clear()
      const lastKey = await db.ticks.bulkAdd(ticks)
      console.log("Last raindrop's id was: " + lastKey);
    } catch (error) {
      console.error(error)
    }
  },
  generateChart() {
    const limit = 1000
    let y = 0
    const dataPoints = []
    for (let i = 0; i < limit; i += 1) {
      y += Math.random() * 10 - 5
      dataPoints.push({
        timestamp: i - limit / 2,
        balance: y,
      })
    }
    return dataPoints
  },
  async runBacktest({}, {ticks, setting}) {
    const trader = new Backtester()
    const result = await trader.run(setting, ticks)
    return result
  },
  async loadResults() {
    // @ts-ignore
    const results = await this.$fire.firestore
      .collection('backtesting')
      // .where('profitPercent', '>=', 100)
      .get()
    return results.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
}
