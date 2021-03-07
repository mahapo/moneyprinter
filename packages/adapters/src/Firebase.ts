import * as firebase from 'firebase-admin'
import { EventEmitter } from 'events'

export class Firebase extends EventEmitter {
  app: firebase.app.App
  db: any
  ref: any
  refInstruments: any
  refSettings: any
  refBinance: any
  refAccounts: any
  refBacktesting: any
  refBalances: any
  refTa: any

  constructor() {
    super()
    this.app = firebase.initializeApp({
      credential: firebase.credential.cert(
        require('@moneyprinter/config/firebase.json')
      )
    })

    this.db = this.app.firestore()
    this.db.settings({ ignoreUndefinedProperties: true })
    this.refInstruments = this.db.collection('instruments')
    this.refSettings = this.db.collection('settings')
    this.refBinance = this.db.collection('binance')
    this.refAccounts = this.db.collection('accounts')
    this.refBacktesting = this.db.collection('backtesting')
    this.refTa = this.db.collection('ta')
  }

  async saveBacktestResult(result, balances) {
    const { id } = await this.refBacktesting.add(result)
    return this.db.collection(`backtesting/${id}/balances`).add({ balances })
  }

  async saveTa(symbol, ta) {
    return this.db
      .collection('ta')
      .doc(symbol.replace('/', ''))
      .set(ta, { merge: true })
  }

  deleteCollection(path) {
    // Get a new write batch
    var batch = this.db.batch()

    this.db
      .collection(path)
      .listDocuments()
      .then(val => {
        val.map(val => {
          console.log(val.id)
          this.deleteCollection(`${path}/${val.id}/balances`)
          batch.delete(val)
        })

        batch.commit()
      })
  }

  // async multipleImport(ref, array, idKey = null) {
  //   let index = 0
  //   for (const chunk of this.chunkArray(array, 500)) {
  //     const batch = this.db.batch()
  //     chunk.forEach(item => {
  //       batch.set(ref.doc(String(item[idKey] || index++)), item)
  //     })
  //     await batch.commit()
  //   }
  // }

  // chunkArray(array, size) {
  //   if (array.length <= size) {
  //     return [array]
  //   }
  //   return [array.slice(0, size), ...this.chunkArray(array.slice(size), size)]
  // }
}
