import * as randomstring from "randomstring"
import { Runner } from "./runner";

export class Backtester extends Runner {
  ticker: any;
  currentCandle: any;
  constructor(account, options) {
    super(account, options);

    this.ticker = this.account.initTicker({
      onTick: async (tick) => { await this.onTick(tick) },
      // product: this.product,
      // onError: (error) => { this.onError(error) }
    })
  }

  async start() {
    try {
      this.account.startTicker()
      // console.log(history);

      // await Promise.all(
      //   history.map((stick, index) => {
      //     const sticks = history.slice(0, index + 1);
      //     return this.strategy.run({
      //       sticks,
      //       time: stick.startTime,
      //     });
      //   })
      // );

      // this.printPositions();
      // this.printProfit();
    } catch (error) {
      console.log(error);
    }
  }

  async onTick(tick) {
    try {
      // if (this.currentCandle) {
      //   this.currentCandle.onPrice({ price, volume, time })
      // } else {
      //   this.currentCandle = new Candlestick({
      //     price: price,
      //     volume: volume,
      //     interval: this.interval,
      //     startTime: time
      //   })
      // }

    //   const sticks = this.history.slice()
    //   sticks.push(this.currentCandle)

      await this.strategy.run(tick)

    //   if (this.currentCandle.state === 'closed') {
    //     const candle = this.currentCandle
    //     this.currentCandle = null
    //     this.history.push(candle)

        this.printPositions()
    //     this.printProfit()
    //   }
    } catch (error) { console.log(error) }
  }

  async onStraddleSignal({ price, time }) {
    const id = randomstring.generate(20);
    this.strategy.positionOpened({
      price,
      time,
      size: 100,
      id,
    });
  }

  // async onShortSignal({ price, size, time, position }) {
  //   // this.strategy.positionClosed({
  //   //   price,
  //   //   time,
  //   //   size,
  //   //   id: position.id,
  //   // });
  // }
}
