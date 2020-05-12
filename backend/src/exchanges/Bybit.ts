import { ExchangeBase } from ".";
import { bybit as BybitCCXT } from "ccxt";
import * as WebSocket from "ws";
import * as crypto from "crypto";
import { Slack } from "../utils/Slack";

// https://bybit-exchange.github.io/docs/inverse/
export class Bybit extends ExchangeBase {
  instance: BybitCCXT;
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
            else if (topic === "stop_order") this.onOrderStop(data);
          }
        });

        this.socket.on("open", () => {
          Slack.log("Websocket open");
          resolve();
          this.socket.send(
            '{"op": "subscribe", "args": ["order", "stop_order"]}'
          );
          heartbeat();
        });

        this.socket.on("close", () => {
          Slack.log("ws disconnected");
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
    for (const order of orders) {
      if (
        order.create_type === "CreateByTakeOver_PassThrough" ||
        order.create_type === "CreateByLiq"
      ) {
        this.emit(`${order.symbol}:Liquidation`, this.formatedOrder(order));
      }
    }
  }

  onOrderStop(orders) {
    for (const order of orders) {
      if (order.order_status === "Created") {
        if (
          order.stop_order_type === "TakeProfit" ||
          order.stop_order_type === "TrailingStop"
        )
          this.emit(`${order.symbol}:TakeProfit`, this.formatedOrder(order));
        else if (order.stop_order_type === "StopLoss")
          this.emit(`${order.symbol}:StopLoss`, this.formatedOrder(order));
        else if (order.order_type === "Market")
          this.emit(`${order.symbol}:Filled`, this.formatedOrder(order));
        else Slack.log(order);
      }
    }
  }

  async reset(symbol) {
    await this.instance.loadMarkets();
    const market = this.instance.market(symbol);
    const request = {
      symbol: market["id"],
    };
    await this.instance.privatePostStopOrderCancelAll(request);
  }

  async placeMarketStopOrder(position, newPosition = true) {
    try {
      const order = position.order;
      Slack.log(`New Order: ${order.toString()}`, position.id);
      if (newPosition) this.lastTime = order.time.getTime();
      const { precision } = this.markets.find(
        (market) => market.base === order.symbol.split("/")[0]
      );

      const basePrice = this.instance.priceToPrecision(
        order.symbol,
        order.side === "buy"
          ? order.price - precision.price
          : parseFloat(order.price) + precision.price
      );

      const params = {
        leverage: order.leverage,
        order_link_id: position.id,
        close_on_trigger: false,
        base_price: basePrice,
        stop_px: order.price,
        trigger_price: basePrice,
        price: order.price,
        trigger_by: "LastPrice",
        // time_in_force: "FillOrKill",
        ordertype: "Conditions",
      };
      let newOrder = await this.instance.createOrder(
        order.symbol,
        "market",
        order.side,
        order.size,
        0,
        // @ts-ignore
        params
      );

      position.idExchange = newOrder.info.stop_order_id;
      this._orders.push(newOrder);
      return newOrder;
    } catch (error) {
      if (
        error.message.includes("expect Rising") ||
        error.message.includes("expect Falling")
      )
        throw error;
      else {
        Slack.send(JSON.stringify(error.message));
        // console.table(position);
        throw error;
      }
    }
  }

  async setTpSLTs(position) {
    try {
      const order = position.order;
      const { precision } = this.markets.find(
        (market) => market.base === order.symbol.split("/")[0]
      );
      Slack.log(`Set trailing: ${order.toString()}`);
      let request = await this.instance.openapiPostPositionTradingStop({
        // take_profit: position.order.takeProfit,
        // stop_loss: position.order.stopLoss,
        trailing_stop: precision.price * 10,
        new_trailing_active: order.takeProfit,
        symbol: order.symbol.replace("/", ""),
      });

      return true;
    } catch (error) {
      Slack.log(error.message);
      return false;
    }
  }

  async cancelOrder(position) {
    try {
      const order = position.order;
      Slack.log(`Delete: ${order.toString()}`);
      let request = await this.instance.openapiPostStopOrderCancel({
        order_link_id: position.id,
        symbol: order.symbol.replace("/", ""),
      });
      position.idExchange = "";
      return true;
    } catch (error) {
      Slack.log(error.message);
      return false;
    }
  }

  async cancelAllPositions(symbol) {
    try {
      let orders = await this.instance.privateGetPositionList({
        symbol: symbol.replace("/", ""),
      });
      if (orders.result.side === "Sell")
        await this.instance.createOrder(
          symbol,
          "market",
          "buy",
          orders.result.size
        );
      else if (orders.result.side === "Buy")
        await this.instance.createOrder(
          symbol,
          "market",
          "sell",
          orders.result.size
        );

      return true;
    } catch (error) {
      Slack.log(error.message);
      return false;
    }
  }

  formatedOrder(orderFromExchange) {
    return {
      id: orderFromExchange.order_link_id,
      idExchange: orderFromExchange.order_id,
      side: orderFromExchange.side.toLowerCase(),
      size: orderFromExchange.qty,
      price: parseFloat(orderFromExchange.trigger_price),
      takeProfit: parseFloat(orderFromExchange.take_profit),
      stopLoss: parseFloat(orderFromExchange.stop_loss),
      info: orderFromExchange,
    };
  }
}
