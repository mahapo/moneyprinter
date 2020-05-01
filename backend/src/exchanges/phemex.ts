import * as fs from "fs";
import * as csv from "csv-parser";

import * as phemex from "../../../ccxt/js/phemex";
import * as WebSocket from "ws";
import { EventEmitter } from "events";
import { performance } from "perf_hooks";
import { isEqual } from "lodash";
import * as configuration from "../configuration";

export class Phemex extends EventEmitter {
  instance: any;
  onFinish: any;
  accounts: any;
  socket: any;
  _orders: any = new Map();
  _positions: any = new Map();
  lastPosition;
  lastOrder;
  markets: any;
  ready: Boolean = false;

  constructor(options) {
    super();
    this.instance = new phemex(options);
  }

  async init() {
    this.markets = await this.instance.fetchMarkets();
    await this.closeAllOrders(this.markets[0]);
    this.startTicker();
  }

  async closeAllOrders(market) {
    const orders = await this.instance.fetchOpenOrders("BTC/USD");
    for (const order of orders) {
      await this.instance.cancelOrder(order.id, "BTC/USD");
    }
  }

  startTicker() {
    console.log("startTicker");
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
      this.authSocket();

      heartbeat();
    });

    this.socket.on("close", function close() {
      console.log("disconnected");
    });

    this.socket.on("message", (data) => {
      let { tick, id, accounts, orders, positions } = JSON.parse(data);
      if (tick && this.ready) {
        this.emit("tick", {
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
      }
      if (orders) {
        this.ready = true;
        this.orders = orders;
      }
      if (positions) this.positions = positions;
      if (accounts) this.accounts = accounts;
    });
  }

  authSocket() {
    console.log("authSocket");
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
      this.emit("tick", tick);
    }
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    this.emit("finish");
  }

  async getTestTickes() {
    // const results = await this.loadCSV("data/BTCUSD_Test_Prints.csv");
    const [aug, sep, okt] = await Promise.all([
      this.loadCSV("data/BTCUSDT_August2019_Binance_prints.csv"),
      this.loadCSV("data/BTCUSDT_September2019_Binance_prints.csv"),
      this.loadCSV("data/BTCUSDT_October2019_Binance_prints.csv"),
    ]);
    const results = [...aug, ...sep, ...okt];

    return results.slice(0, 100000).map((tick) => {
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
      let { data } = await this.instance.privatePostOrders(options);
      console.log(`Order places:`, data.clOrdID);
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

  set orders(orders) {
    orders.forEach((order) => {
      const id = order.clOrdID;
      order = this.instance.parseOrder(order, this.markets[0]);
      order.id = id;
      if (id.includes(configuration.get("KEY"))) {
        delete order.info;
        const old = this._orders.get(order.id);
        if (old) {
          const same = isEqual(old, order);
          if (!same && old.status !== "canceled") {
            if (old.status === "filled") {
              this.lastOrder = order;
              this.emit("order_filled", order);
            }
            this.emit("order_updated", order);
            this._orders.set(order.id, order);
          }
        } else {
          this._orders.set(order.id, order);
          this.emit("order_added", order);
        }
      }
    });
  }

  get orders() {
    return this._orders;
  }

  get openOrders() {
    return Array.from(this._orders.values()).filter(
      ({ status }) => status === "open"
    );
  }

  set positions(positions) {
    this._positions = new Map();
    positions
      // .filter((position) => position.transactTimeNs)
      .forEach((position) => {
        let id = position.transactTimeNs;
        // console.log(id);

        this._positions.set(id, position);
        this.emit("position_updated", position);
        const old = this._positions.get(id);
        if (old) {
          // const same = isEqual(old, position);
          // if (!same) {
          // }
        } else {
          this._positions.set(id, position);
          this.lastPosition = position;
          if (this.lastOrder) {
            this.lastOrder.position = position;
            this.lastPosition.order = this.lastOrder;
          }
          this.emit("position_added", this.lastPosition);
          console.log(this.lastPosition);
        }
      });
  }

  get positions() {
    return this._positions;
  }
}
