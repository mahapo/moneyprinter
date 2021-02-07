import { firestoreAction } from 'vuexfire'

export const state = () => ({
  markets: {},
})

export const actions = {
  initMarkets: firestoreAction(function ({ bindFirestoreRef }) {
    return bindFirestoreRef(
      'markets',
      // @ts-ignore
      this.$fire.firestore.collection('binance').doc('markets')
    )
  }),
}
export const getters = {}
