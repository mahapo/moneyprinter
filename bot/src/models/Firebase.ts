import * as firebase from 'firebase-admin'
import * as dayjs from 'dayjs'
import { EventEmitter } from 'events'

// Add the Firebase services that you want to use
// import 'firebase/auth'
// import 'firebase/firestore'

export class Firebase extends EventEmitter {
  app: firebase.app.App
  db: any
  ref: any
  refInstruments: any
  refSettings: any
  refBinance: any
  refAccounts: any

  constructor() {
    super()
    this.app = firebase.initializeApp({
      credential: firebase.credential.cert(require('../config/firebase.json'))
    })

    this.db = this.app.firestore()
    this.db.settings({ ignoreUndefinedProperties: true })
    this.refInstruments = this.db.collection('instruments')
    this.refSettings = this.db.collection('settings')
    this.refBinance = this.db.collection('binance')
    this.refAccounts = this.db.collection('accounts')

    // this.refSettings.doc('manu').onSnapshot(doc => {
    //   var { cookie } = doc.data()
    //   if (cookie) {
    //     this.emit('newCookie', cookie)
    //   }
    // })
  }

  async deleteCookie() {
    // this.refSettings.doc('manu').set({
    //   cookie: ''
    // })
  }

  async multipleImport(ref, array, idKey = null) {
    let index = 0
    for (const chunk of this.chunkArray(array, 500)) {
      const batch = this.db.batch()
      chunk.forEach(item => {
        batch.set(ref.doc(String(item[idKey] || index++)), item)
      })
      await batch.commit()
    }
  }

  chunkArray(array, size) {
    if (array.length <= size) {
      return [array]
    }
    return [array.slice(0, size), ...this.chunkArray(array.slice(size), size)]
  }
}
