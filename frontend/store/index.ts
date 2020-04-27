export const actions = {
  async nuxtServerInit({ dispatch }) {
    await dispatch('exchange/startWebSocket')
  }
};
