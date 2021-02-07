import { OrderFutures } from '@moneyprinter/models'

export class StrategyBase {
  static id: string = 'aa'
  orders: OrderFutures[] = []

  async run({ sticks = [], time, price }) {}

  get activeOrders() {
    return this.orders.filter(order => order.status === 'open')
  }

  get openOrders() {
    return this.orders.filter(order => order.status === 'open')
  }

  get overview() {
    return this.orders.map(order => ({
      profit: order.pnl,
      priceExit: order.priceExit,
      ...order
    }))
  }

  get profitTotal() {
    return this.orders.reduce((r, p) => {
      return r + p.pnl
    }, 0)
  }

  printOrders() {
    this.orders.forEach(p => {
      p.print()
    })
  }

  printActiveOrders() {
    this.activeOrders.forEach(p => {
      p.print()
    })
  }

  // printProfit() {
  //   const prof = `${this.profitTotal}`
  //   const colored = this.profitTotal > 0 ? colors.green(prof) : colors.red(prof)
  //   console.log(`Total: ${colored}`)
  // }
}
