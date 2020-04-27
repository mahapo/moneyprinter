import io from 'socket.io-client'

const socket = io('wss://testnet.phemex.com/ws')

export const state = () => ({
  loading: false,
  dark: false,
  drawer: null,
  color: 'success',
})

export const mutations = {}

export const actions = {
  async startWebSocket({ dispatch }) {
    socket.on('open', function open() {
      // ws.send('something')
    })

    socket.on('message', function incoming(data) {
      console.log(data)
    })
  },
}
