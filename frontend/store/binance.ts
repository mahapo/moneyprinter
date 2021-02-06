import { firestoreAction } from 'vuexfire'

export const state = () => ({
  markets: {},
  backtesting: [],
})

export const actions = {
  bindCountDocument: firestoreAction(function ({ bindFirestoreRef }) {
    // // @ts-ignore
    // const ref = this.$fire.firestore.collection('binance').doc('markets')
    // bindFirestoreRef('markets', ref, { wait: true })
    // // @ts-ignore
    // const refBacktesting = this.$fire.firestore.collection('backtesting')
    // bindFirestoreRef('backtesting', refBacktesting)
  }),
}
export const getters = {}
