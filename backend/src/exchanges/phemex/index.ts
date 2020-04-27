import * as fs from "fs";
import * as csv from "csv-parser";

import * as phemex from "../../../../ccxt/js/phemex";
import * as WebSocket from "ws";
import { EventEmitter } from "events";
import { performance } from "perf_hooks";

import { Candlestick } from "../../models";

export class Phemex extends EventEmitter {
  instance: any;
  onTick: any;
  onFinish: any;
  socket: any;

  constructor(options) {
    super();
    this.instance = new phemex(options);
  }

  initTicker({ onTick, onFinish }) {
    this.onTick = onTick;
    this.onFinish = onFinish;
  }

  startTicker() {
    this.socket = new WebSocket("wss://testnet.phemex.com/ws");
    let id = 1;

    const heartbeat = () => {
      if (!this.socket) return;
      if (this.socket.readyState !== 1) return;
      this.socket.send(
        JSON.stringify({
          method: "server.ping",
          params: [".LINK"],
          id: id++,
        })
      );
      setTimeout(heartbeat, 10000);
    };

    this.socket.on("open", () => {
      this.socket.send(
        JSON.stringify({
          method: "tick.subscribe",
          params: [".BTC"],
          id: id++,
        })
      );

      heartbeat();
    });

    this.socket.on("close", function close() {
      console.log("disconnected");
    });

    this.socket.on("message", (data) => {
      // console.log(data);
      let { tick, id, accounts } = JSON.parse(data);

      if (tick) {
        this.onTick({
          price: tick.last / Math.pow(10, 4),
          time: new Date(tick.timestmp / 1000000),
        });
      } else if (id === 0) {
        this.socket.send(
          JSON.stringify({
            id: id++,
            method: "aop.subscribe",
            params: [],
          })
        );
      } else if (accounts) {
        console.log(accounts[0]);
      }
    });
  }

  authSocket() {
    const expiry = parseInt(
      this.instance.numberToString(this.instance.seconds() + 2 * 60)
    );
    const content = this.instance.apiKey + expiry;
    const signature = this.instance.hmac(content, this.instance.secret);

    this.socket.send(
      JSON.stringify({
        method: "user.auth",
        params: ["API", this.instance.apiKey, signature, expiry],
        id: 0,
      })
    );
  }

  async startDemoTicker(interval = 1) {
    let ticks = await this.getTestTickes();
    console.log(ticks.length);
    var t0 = performance.now();
    for (let tick of ticks) {
      // await new Promise(resolve => setInterval(resolve, 10))
      this.onTick(tick);
    }
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    this.onFinish();
  }

  async getTestTickes() {
    // const results = await this.loadCSV("data/BTCUSD_Test_Prints.csv");
    const [aug, sep, okt] = await Promise.all([
      this.loadCSV("data/BTCUSDT_August2019_Binance_prints.csv"),
      this.loadCSV("data/BTCUSDT_September2019_Binance_prints.csv"),
      this.loadCSV("data/BTCUSDT_October2019_Binance_prints.csv"),
    ]);
    const results = [...aug, ...sep, ...okt];

    return results.slice(0, 5000000).map((tick) => {
      const time = new Date(parseFloat(tick.unix));
      // @ts-ignore
      time.setHours(...tick.date.split(":").join(".").split("."));

      return {
        time,
        price: parseFloat(tick.price),
        volume: parseFloat(tick.amount),
      };
    });
  }

  async loadCSV(file = "data/BTCUSDT_August2019_Binance_prints.csv") {
    // http://www.cryptodatadownload.com/data/northamerican/
    let data = [];
    return new Promise((resolve) => {
      fs.createReadStream(file)
        .pipe(csv())
        .on("data", (d) => data.push(d))
        .on("end", () => resolve(data));
    });
  }

  async placeOrder(position) {
    const order = position.order;
    try {
      const options = {
        actionBy: "FromOrderPlacement",
        symbol: "BTCUSD",
        clOrdID: position.id,
        side: order.side === "long" ? "Buy" : "Sell",
        ordType: "Stop",
        orderQty: order.size,
        priceEp: this.instance.convertToEp(order.price), // Scaled price, required for limit order
        triggerType: "ByLastPrice",
        stopPxEp: this.instance.convertToEp(order.price), // Trigger price for stop orders
        closeOnTrigger: false,
        reduceOnly: false,
        // direction: "≥",
        pegPriceType: "UNSPECIFIED",
        timeInForce: "ImmediateOrCancel",
        takeProfitEp: this.instance.convertToEp(order.takeProfit),
        stopLossEp: this.instance.convertToEp(order.stopLoss),
      };
      let id = await this.instance.privatePostOrders(options);
      console.log(id);
    } catch (error) {
      console.error(error);
    }
  }

  updatePosition({ price, time }) {
    let options = {
      actionBy: "FromPosition",
      clOrdID: "45823391-43c6-febc-470f-6b9c06135f8e",
      symbol: "BTCUSD",
      side: "Sell",
      ordType: "Stop",
      orderQty: 0,
      priceEp: 75790000,
      triggerType: "ByLastPrice",
      stopPxEp: 76370000,
      closeOnTrigger: true,
      timeInForce: "ImmediateOrCancel",
      pegPriceType: "TrailingTakeProfitPeg",
      pegOffsetValueEp: -30000,
    };
  }
}
