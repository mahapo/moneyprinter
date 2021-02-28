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
  RESET_STORE: (state1) => {
    Object.assign(state1, state())
  },

  SET_AUTH_USER: (state, authUser) => {
    state.authUser = {
      uid: authUser.uid,
      email: authUser.email,
    }
  },

  ON_AUTH_STATE_CHANGED_MUTATION: (state, { authUser, _claims }) => {
    // Do this:
    const { uid, email, emailVerified } = authUser
    state.authUser = { uid, email, emailVerified }
  },
}

export const actions = {
  onAuthStateChanged({ commit }, { authUser }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    console.log('AuthStateChangedAction', authUser)
    commit('SET_AUTH_USER', authUser)
  },
}
