import { ExchangeBase } from ".";
import { bybit as BybitCCXT } from "ccxt";
import * as WebSocket from "ws";
import * as crypto from "crypto";

export class Bybit extends ExchangeBase {
  constructor(options, demo) {
    super(options);
    this.instance = new BybitCCXT(options);
    this.instance.setSandboxMode(demo);
  }

  startWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(
          "wss://stream-testnet.bybit.com/realtime?" + this.getSignature()
        );
        const heartbeat = () => {
          if (!this.socket) return;
          if (this.socket.readyState !== 1) return;
          this.socket.send('{"op":"ping"}');
          setTimeout(heartbeat, 10000);
        };

        this.socket.on("message", (message) => {
          const { topic, data } = JSON.parse(message);
          if (topic) {
            if (topic === "order") this.onOrder(data);
            else if (topic === "position") this.onPosition(data);
            else if (topic === "execution") this.onExecution(data);
            else if (topic === "stop_order") this.onOrderStop(data);
            else if (topic.includes("instrument_info"))
              this.onInstrumentInfo(data);
          }
        });

        this.socket.on("open", () => {
          console.log("Websocket open");
          resolve();
          this.socket.send(
            '{"op": "subscribe", "args": ["instrument_info.100ms.XRPUSD"]}'
          );
          this.socket.send(
            '{"op": "subscribe", "args": ["position", "order", "execution", "stop_order"]}'
          );
          heartbeat();
        });

        this.socket.on("close", () => {
          console.log("ws disconnected");
          reject("ws disconnected");
          throw new Error("socket error");
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getSignature() {
    var expires = this.instance.nonce() + 1000;

    var signature = crypto
      .createHmac("sha256", this.instance.secret)
      .update("GET/realtime" + expires)
      .digest("hex");

    return `api_key=${this.instance.apiKey}&expires=${expires}&signature=${signature}`;
  }

  onOrder(orders) {
    // orders = orders.map((order) => this.instance.parseOrder(order))
    // // console.log(orders);
    // this._orders.push(...orders)
    // this.emit("orders")
  }

  onPosition(positions) {
    //   this.positions = positions
    //   this.emit("positions")
    //   console.log("positions", positions);
  }

  onExecution(execution) {
    // console.log("execution", execution);
    // const order = this.orders.find(order => order.id === execution[0].execID)
    // if(order) console.log("Position created:", order.info.order_link_id)
  }

  onOrderStop(orders) {
    const position = this.activeOrders
      .filter((order) => order.info.qty === orders[0].qty)
      .find((order) => order.info.side === orders[0].side);

    if (orders[0].order_status === "Created") {
      if (orders[0].stop_order_type === "TakeProfit")
        this.emit("TakeProfit", position);
      else if (orders[0].stop_order_type === "StopLoss")
        this.emit("StopLoss", position);
      else if (orders[0].order_type === "Market") this.emit("Filled", position);
    }
  }

  onInstrumentInfo(info) {
    // console.log("stop_order", info.update);
  }

  async placeMarketStopOrder(position) {
    try {
      const order = position.order;
      console.log(
        `Order: ${position.symbol} ${order.side} ${order.size} @ ${order.price} - TP: ${order.takeProfit} SL: ${order.stopLoss}`
      );
      this.lastTime = order.time.getTime();
      const params = {
        leverage: order.leverage,
        order_link_id: position.id,
        close_on_trigger: false,
        base_price: order.basePrice,
        stop_px: order.price,
        trigger_price: order.basePrice,
        price: order.price,
        trigger_by: "LastPrice",
        // time_in_force: "FillOrKill",
        ordertype: "Conditions",
      };
      let newOrder = await this.instance.createOrder(
        "BTC/USD",
        "market",
        order.side,
        order.size,
        0,
        params
      );

      position.idExchange = newOrder.info.stop_order_id;
      this._orders.push(newOrder);
      return newOrder;
    } catch (error) {
      console.debug(error.message);
    }
  }

  async updateOrder(position) {
    try {
      const order = position.order;
      console.log(
        `Order update: ${position.idExchange} ${position.symbol} ${order.side} ${order.size} @ ${order.price} - TP: ${order.takeProfit} SL: ${order.stopLoss}`
      );
      let result = await this.instance.editOrder(
        position.idExchange,
        "BTC/USD",
        null,
        null,
        position.order.size,
        undefined,
        {
          stop_order_id: position.idExchange,
        }
      );
      return true;
    } catch (error) {
      console.debug(error.message);
      return false;
    }
  }

  async setTpSLTs(position) {
    try {
      const order = position.order;
      console.log(
        `Set TP SL: ${order.size} @ ${order.price} - TP: ${order.takeProfit} SL: ${order.stopLoss}`
      );
      let request = await this.instance.openapiPostPositionTradingStop({
        take_profit: position.order.takeProfit,
        // stop_loss: position.order.stopLoss,
        // new_tp_trigger_by: "LastPrice",
        // new_sl_trigger_by: "LastPrice",
        // new_trailing_stop: 0,
        // new_trailing_active: 0,

        symbol: "BTCUSD",
      });

      return true;
    } catch (error) {
      console.debug(error.message);
      return false;
    }
  }
}
