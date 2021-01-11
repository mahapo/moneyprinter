export const state = () => ({
  authUser: null,
})

export const getters = {
  isLoggedIn: (state) => {
    try {
      return state.authUser.id !== null
    } catch {
      return false
    }
  },
}

export const mutations = {
  RESET_STORE: (state) => {
    Object.assign(state, state())
  },

  SET_AUTH_USER: (state, authUser) => {
    state.authUser = {
      uid: authUser.uid,
      email: authUser.email,
    }
  },
}

export const actions = {
  onAuthStateChanged({ commit }, { authUser, _claims }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    console.log('AuthStateChangedAction', authUser)
    commit('SET_AUTH_USER', authUser)
  },
}
