import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'
import SocketIO from 'socket.io-client'

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: 'ws://localhost:5000',
    // vuex: {
    //   // store,
    //   actionPrefix: 'SOCKET_',
    //   mutationPrefix: 'SOCKET_',
    // },
    // options: { path: '/' }, //Optional options
  })
)
