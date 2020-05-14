import Vue from 'vue'
import VueSocketIOExt from 'vue-socket.io-extended'
import io from 'socket.io-client'

const socket = io('ws://localhost:5000/socket')

export default ({ store }) => {
  Vue.use(VueSocketIOExt, socket, { store })
}
