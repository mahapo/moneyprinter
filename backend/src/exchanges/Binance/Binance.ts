import { ExchangeBase } from "..";
import { binance as BinanceCCXT } from "ccxt";
import * as WebSocket from "ws";
import * as crypto from "crypto";
import { Logger } from "../../utils/Logger";

export class Binance extends ExchangeBase {
  instance: BinanceCCXT;

  constructor(options, private demo) {
    super(options);
    this.instance = new BinanceCCXT(this.options);
    this.instance.setSandboxMode(this.demo);
  }

  startWebSocket() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket("wss://stream.binancefuture.com");
      const heartbeat = () => {
        if (!this.socket) return;
        if (this.socket.readyState !== 1) return;
        this.socket.send('{"op":"ping"}');
        setTimeout(heartbeat, 10000);
      };

      this.socket.on("message", (message) => {
        // const { topic, data } = JSON.parse(message);
        // if (topic === "order") this.onOrder(data);
        // else if (topic === "stop_order") this.onOrderStop(data);
      });

      this.socket.on("open", () => {
        // // Logger.info("Websocket open");
        // resolve();
        // this.socket.send(
        //   '{"op": "subscribe", "args": ["order", "stop_order"]}'
        // );
        // heartbeat();
      });

      this.socket.on("error", (error) => {
        reject(error);
        throw new Error(error);
      });

      this.socket.on("close", (error) => {
        this.emit("disconnected");
        reject(error);
        throw new Error(error);
      });
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

  onOrder(orders) {}

  onOrderStop(orders) {}

  async resetAll(symbol) {
    try {
      await this.instance.cancelAllOrders(symbol);
    } catch (error) {
      throw Logger.error(this.formatError(error));
    }
  }

  async setLeverage(symbol, leverage) {
    // try {
    //   await this.instance.userPostLeverageSave({
    //     symbol: symbol.replace("/", ""),
    //     leverage,
    //   });
    // } catch (error) {
    //   if (!error.message.includes("old leverage"))
    //     throw Logger.error(this.formatError(error));
    // }
  }

  async placeMarketStopOrder(order, newPosition = true) {
    try {
      Logger.info(`New Order: ${order.toString()}`);
      if (newPosition) this.lastTime = order.timestamp;
      const { precision } = this.markets.find(
        (market) => market.base === order.symbol.split("/")[0]
      );
      const price = this.instance.priceToPrecision(order.symbol, order.price);

      let newOrder = await this.instance.createOrder(
        order.symbol,
        "STOP_MARKET",
        order.side,
        order.amount,
        0,
        // @ts-ignore
        {
          stopPrice: price,
          workingType: "MARK_PRICE",
          newClientOrderId: order.idUser,
        }
      );
      order.id = newOrder.info.clientOrderId;
      this._orders.push(newOrder);
      return newOrder;
    } catch (error) {
      // TODO: Order would immediately trigger.
      if (error.message.includes("Order would immediately trigger."))
        throw this.formatError(error);
      else {
        throw this.formatError(error);
      }
    }
  }

  async setTpSLTs(order) {
    // try {
    //   const { precision } = this.markets.find(
    //     (market) => market.base === order.symbol.split("/")[0]
    //   );
    //   let options = { symbol: order.symbol.replace("/", "") };
    //   if (!order.takeProfitSet) {
    //     Logger.info(`Set trailing: ${order.toString()}`);
    //     //options["take_profit"] = order.takeProfit
    //     options["trailing_stop"] = precision.price * 5; // Creates more Profit as take_profit
    //     options["new_trailing_active"] = order.takeProfit;
    //     order.takeProfitSet = true;
    //   }
    //   if (!order.stopLossSet) {
    //     Logger.info(`Set stop loss: ${order.toString()}`);
    //     options["stop_loss"] = order.stopLoss;
    //     order.stopLossSet = true;
    //   }
    //   let request = await this.instance.openapiPostPositionTradingStop(options);
    //   return true;
    // } catch (error) {
    //   // TODO: Handel error: TrailingProfit:201.95 set for Sell position should be less than entry_price:194.05??LastPrice and last_price:195.65
    //   // TODO: Handel 'StopLoss:211.5 set for Buy position should be between liq_price:212 and base_price:214.1??LastPrice'
    //   Logger.error(this.formatError(error));
    //   throw this.formatError(error);
    // }
  }

  async cancelOrder(order) {
    // try {
    //   Logger.info(`Delete: ${order.toString()}`);
    //   let request = await this.instance.openapiPostStopOrderCancel({
    //     order_link_id: order.idUser,
    //     symbol: order.symbol.replace("/", ""),
    //   });
    //   order.id = "";
    //   return true;
    // } catch (error) {
    //   throw this.formatError(error);
    // }
  }

  async cancelAllPositions(symbol) {
    // try {
    //   let orders = await this.instance.privateGetPositionList({
    //     symbol: symbol.replace("/", ""),
    //   });
    //   if (orders.result.side === "Sell" && orders.result.size)
    //     await this.instance.createOrder(
    //       symbol,
    //       "market",
    //       "buy",
    //       orders.result.size
    //     );
    //   else if (orders.result.side === "Buy" && orders.result.size)
    //     await this.instance.createOrder(
    //       symbol,
    //       "market",
    //       "sell",
    //       orders.result.size
    //     );
    //   return true;
    // } catch (error) {
    //   throw this.formatError(error);
    // }
  }

  async getCurrentOrdersAndPosition(symbol) {
    // let positions = await this.instance.privateGetPositionList({
    //   symbol: symbol.replace("/", ""),
    // });
    // let orders = await this.instance.fetchOrders(symbol);
    // return [orders, positions];
  }

  async getLastPrice(symbol) {
    // try {
    //   let { info } = await this.instance.fetchTicker(symbol, {});
    //   let { last_price, mark_price, index_price } = info;
    //   return parseFloat(mark_price);
    // } catch (error) {
    //   throw this.formatError(error);
    // }
  }

  formatedOrder(orderFromExchange) {
    // return {
    //   id: orderFromExchange.order_link_id,
    //   idUser: orderFromExchange.order_id,
    //   side: orderFromExchange.side.toLowerCase(),
    //   amount: orderFromExchange.qty,
    //   price: parseFloat(orderFromExchange.trigger_price),
    //   takeProfit: parseFloat(orderFromExchange.take_profit),
    //   stopLoss: parseFloat(orderFromExchange.stop_loss),
    //   raw: JSON.stringify(orderFromExchange),
    //   symbol: orderFromExchange.symbol,
    // };
  }

  formatError(error) {
    try {
      return {
        ...error,
        message: JSON.parse(error.message.replace("binance ", "")),
      };
    } catch {
      return error;
    }
  }
}
