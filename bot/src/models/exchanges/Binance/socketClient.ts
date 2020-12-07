import * as WebSocket from 'ws'
// import logger from './logger'

class SocketClient {
  baseUrl: any
  _path: any
  _handlers: Map<any, any>
  _ws: WebSocket
  constructor(path, baseUrl = null) {
    this.baseUrl = baseUrl || 'wss://stream.binance.com/'
    this._path = path
    this._createSocket()
    this._handlers = new Map()
  }

  _createSocket() {
    console.log(`${this.baseUrl}${this._path}`)
    this._ws = new WebSocket(`${this.baseUrl}${this._path}`)

    this._ws.onopen = () => {
      console.info('ws connected')
    }

    this._ws.on('pong', () => {
      console.info('receieved pong from server')
    })
    this._ws.on('ping', () => {
      console.info('==========receieved ping from server')
      this._ws.pong()
    })

    this._ws.onclose = () => {
      console.warn('ws closed')
    }

    this._ws.onerror = err => {
      console.warn('ws error', err)
    }

    this._ws.onmessage = msg => {
      try {
        const message = JSON.parse(msg.data)
        if (message.stream || message.e) {
          if (this._handlers.has(message.stream || message.e)) {
            this._handlers.get(message.stream || message.e).forEach(cb => {
              cb(message)
            })
          } else {
            console.warn('Unprocessed method', message)
          }
        } else {
          console.warn('Unprocessed method', message)
        }
      } catch (e) {
        console.warn('Parse message failed', e)
      }
    }

    this.heartBeat()
  }

  heartBeat() {
    setInterval(() => {
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.ping()
        console.info('ping server')
      }
    }, 5000)
  }

  setHandler(method, callback) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, [])
    }
    this._handlers.get(method).push(callback)
  }
}

export default SocketClient
