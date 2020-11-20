import { make } from 'vuex-pathify'
import bybit from '../../backend/src/exchanges/Bybit/markets.json'
import binance from '../../backend/src/exchanges/Binance/markets.json'

export const state = () => ({
  loading: false,
  dark: false,
  drawer: null,
  color: 'success',
  markets: { bybit, binance },
})

export const getters = make.getters(state)
export const mutations = make.mutations(state)
export const actions = make.actions(state)
