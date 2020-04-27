import { Factory } from "../strategy";
import * as colors from "colors/safe";
const EventEmitter = require("events");

export class Runner extends EventEmitter {
  account: any;
  startTime: any;
  endTime: any;
  interval: any;
  product: any;
  historical: any;
  strategyType: any;
  strategy: any;

  constructor(account, { /*start, end, interval,*/ product, strategyType }) {
    super();
    this.account = account;
    // this.startTime = start;
    // this.endTime = end;
    // this.interval = interval;
    this.product = product;
    // this.historical = new account.Historical({
    //   start,
    //   end,
    //   interval,
    //   product,
    // });
    this.strategyType = strategyType;
    this.strategy = Factory.create(this.strategyType, {
      onLongSignal: this.onLongSignal.bind(this),
      onShortSignal: this.onShortSignal.bind(this),
      onStraddleSignal: this.onStraddleSignal.bind(this),
    });
  }

  async start() {}
  async onLongSignal(data) {}
  async onShortSignal(data) {}
  async onStraddleSignal(data) {}
}
