import { ExchangeBase } from ".";
import { bybit as BybitCCXT } from "ccxt";
import * as WebSocket from "ws";
import * as crypto from "crypto";
import { Logger } from "../utils/Logger";

// https://bybit-exchange.github.io/docs/inverse/
export class Bybit extends ExchangeBase {
  instance: BybitCCXT;

  constructor(options, private demo) {
    super(options);
    this.instance = new BybitCCXT(options);
    this.instance.setSandboxMode(demo);
  }

  startWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(
          this.demo
            ? "wss://stream-testnet.bybit.com/realtime?" + this.getSignature()
            : "wss://stream.bybit.com/realtime?" + this.getSignature()
        );
        const heartbeat = () => {
          if (!this.socket) return;
          if (this.socket.readyState !== 1) return;
          this.socket.send('{"op":"ping"}');
          setTimeout(heartbeat, 10000);
        };

        this.socket.on("message", (message) => {
          const { topic, data } = JSON.parse(message);
          if (topic === "order") this.onOrder(data);
          else if (topic === "stop_order") this.onOrderStop(data);
        });

        this.socket.on("open", () => {
          // Logger.info("Websocket open");
          resolve();
          this.socket.send(
            '{"op": "subscribe", "args": ["order", "stop_order"]}'
          );
          heartbeat();
        });

        this.socket.on("error", (error) => {
          Logger.error(error);
          reject(error);
        });

        this.socket.on("close", () => {
          this.emit("disconnected");
        });
      } catch (error) {
        this.emit("disconnected");
        Logger.error(error);
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
        else Logger.info(order);
      }
    }
  }

  async resetAll(symbol) {
    try {
      await this.instance.loadMarkets();
      const market = this.instance.market(symbol);
      const request = {
        symbol: market["id"],
      };
      await this.instance.privatePostStopOrderCancelAll(request);
      await this.cancelAllPositions(symbol);
    } catch (error) {
      Logger.error(this.formatError(error));
    }
  }

  async setLeverage(symbol, leverage) {
    try {
      await this.instance.userPostLeverageSave({
        symbol: symbol.replace("/", ""),
        leverage,
      });
    } catch (error) {
      if (!error.message.includes("old leverage"))
        Logger.error(this.formatError(error));
    }
  }

  async placeMarketStopOrder(order, newPosition = true) {
    try {
      Logger.info(`New Order: ${order.toString()}`);
      if (newPosition) this.lastTime = order.timestamp;
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
        order_link_id: order.idUser,
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
        order.amount,
        0,
        // @ts-ignore
        params
      );

      order.id = newOrder.info.stop_order_id;
      this._orders.push(newOrder);
      return newOrder;
    } catch (error) {
      // TODO: Handel error: expect Rising, but trigger_price[9745.5] <= current[9745.5]??LastPrice
      // TODO: Handel error: expect Falling, but trigger_price[9745.5] >= current[9745.5]??LastPrice
      Logger.error(this.formatError(error));
      if (
        error.message.includes("expect Rising") ||
        error.message.includes("expect Falling")
      )
        throw error;
      else {
        throw error;
      }
    }
  }

  async setTpSLTs(order) {
    try {
      const { precision } = this.markets.find(
        (market) => market.base === order.symbol.split("/")[0]
      );
      let options = { symbol: order.symbol.replace("/", "") };

      if (!order.takeProfitSet) {
        Logger.info(`Set trailing: ${order.toString()}`);
        //options["take_profit"] = order.takeProfit
        options["trailing_stop"] = precision.price * 5; // Creates more Profit as take_profit
        options["new_trailing_active"] = order.takeProfit;

        order.takeProfitSet = true;
      }

      if (!order.stopLossSet) {
        Logger.info(`Set stop loss: ${order.toString()}`);
        options["stop_loss"] = order.stopLoss;
        order.stopLossSet = true;
      }

      let request = await this.instance.openapiPostPositionTradingStop(options);

      return true;
    } catch (error) {
      // TODO: Handel error: TrailingProfit:201.95 set for Sell position should be less than entry_price:194.05??LastPrice and last_price:195.65
      // TODO: Handel 'StopLoss:211.5 set for Buy position should be between liq_price:212 and base_price:214.1??LastPrice'
      Logger.error(this.formatError(error));
      return false;
    }
  }

  async cancelOrder(order) {
    try {
      Logger.info(`Delete: ${order.toString()}`);
      let request = await this.instance.openapiPostStopOrderCancel({
        order_link_id: order.idUser,
        symbol: order.symbol.replace("/", ""),
      });
      order.id = "";
      return true;
    } catch (error) {
      Logger.error(this.formatError(error));
      return false;
    }
  }

  async cancelAllPositions(symbol) {
    try {
      let orders = await this.instance.privateGetPositionList({
        symbol: symbol.replace("/", ""),
      });
      if (orders.result.side === "Sell" && orders.result.size)
        await this.instance.createOrder(
          symbol,
          "market",
          "buy",
          orders.result.size
        );
      else if (orders.result.side === "Buy" && orders.result.size)
        await this.instance.createOrder(
          symbol,
          "market",
          "sell",
          orders.result.size
        );

      return true;
    } catch (error) {
      Logger.error(this.formatError(error));
      return false;
    }
  }

  async getCurrentOrdersAndPosition(symbol) {
    let positions = await this.instance.privateGetPositionList({
      symbol: symbol.replace("/", ""),
    });
    let orders = await this.instance.fetchOrders(symbol);
    return [orders, positions];
  }

  async getLastPrice(symbol) {
    try {
      let { info } = await this.instance.fetchTicker(symbol, {});
      let { last_price, mark_price, index_price } = info;
      return parseFloat(last_price);
    } catch (error) {}
  }

  formatedOrder(orderFromExchange) {
    return {
      id: orderFromExchange.order_link_id,
      idUser: orderFromExchange.order_id,
      side: orderFromExchange.side.toLowerCase(),
      amount: orderFromExchange.qty,
      price: parseFloat(orderFromExchange.trigger_price),
      takeProfit: parseFloat(orderFromExchange.take_profit),
      stopLoss: parseFloat(orderFromExchange.stop_loss),
      raw: JSON.stringify(orderFromExchange),
      symbol: orderFromExchange.symbol,
    };
  }

  formatError(error) {
    return {
      ...error,
      message: JSON.parse(error.message.replace("bybit ", "")),
    };
  }
}
