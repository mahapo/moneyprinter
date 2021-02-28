import { firestoreAction } from 'vuexfire'

export const state = () => ({
  settings: {},
})

export const getters = {}

export const mutations = {}

export const actions = {
  initSettings: firestoreAction(function ({ bindFirestoreRef, rootState }) {
    // @ts-ignore
    const { uid } = rootState.auth.authUser
    return bindFirestoreRef(
      'settings',
      // @ts-ignore
      this.$fire.firestore.collection('users').doc(uid)
    )
  }),
  saveSettings({ rootState }, payload) {
    const { uid } = rootState.auth.authUser
    // @ts-ignore
    return this.$fire.firestore.collection('users').doc(uid).set(payload, {
      merge: true,
    })
  },
}
