import { make } from 'vuex-pathify'

export const state = () => ({
  loading: false,
  dark: false,
  drawer: null,
  color: 'success',
})

export const getters = make.getters(state)
export const mutations = make.mutations(state)
export const actions = make.actions(state)
