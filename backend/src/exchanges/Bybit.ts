import { ExchangeBase } from ".";
import { bybit as BybitCCXT } from "ccxt";
import * as WebSocket from "ws";
import * as crypto from "crypto";

export class Bybit extends ExchangeBase {

  constructor(options, demo) {
    super(options);
    if (demo) {
      options.urls = {
        api: "https://api-testnet.bybit.com",
      };
    }

    this.instance = new BybitCCXT(options);
  }

  startWebSocket() {
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
            if(topic) {
                if (topic === "order") this.onOrder(data);
                else if (topic === "position") this.onPosition(data);
                else if (topic === "execution") this.onExecution(data);
                else if (topic === "stop_order") this.onOrderStop(data);
                else if (topic.includes("instrument_info")) this.onInstrumentInfo(data);
            }
          });
      
          this.socket.on("open", () => {
            console.log("open");
            this.socket.send('{"op": "subscribe", "args": ["instrument_info.100ms.XRPUSD"]}');
            this.socket.send('{"op": "subscribe", "args": ["position", "order", "execution", "stop_order"]}');
            heartbeat();
          });
      
          this.socket.on("close", () => {
            console.log("disconnected");
            this.startWebSocket();
          });
      } catch (error) {
          this.startWebSocket()
      }

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
    const order = this.orders.find(order => order.id === execution[0].execID)
    if(order) console.log("Position created:", order.info.order_link_id)
  }

  onOrderStop(orders) {
      const position = this.activeOrders
      .filter(order => order.info.qty === orders[0].qty)
      .find(order => order.info.side === orders[0].side)
      if(orders[0].order_status === 'Created') {
        // console.log("stop_order", orders[0].order_status, orders[0].order_type, orders[0].stop_order_type,orders[0].qty, orders[0].side);
          if(orders[0].stop_order_type === 'TakeProfit') this.emit("TakeProfit", position)
          else if(orders[0].stop_order_type === 'StopLoss') this.emit("StopLoss", position)
          else if(orders[0].order_type === 'Market') this.emit("Filled", position)
      }
    //   if(orders[0].order_status === 'Untriggered') {
    //       if(orders[0].stop_order_type === 'TakeProfit') console.log("TakeProfit set")
    //       else if(orders[0].stop_order_type === 'StopLoss') console.log("StopLoss set")
    //   }
  }

  onInstrumentInfo(info) {
    // console.log("stop_order", info.update);
  }

  async placeOrder(position) {
    const order = position.order;
    this.lastTime = order.time.getTime();
    try {
      const params = {
        leverage: order.leverage,
        stop_loss: order.stopLoss,
        take_profit: order.takeProfit,
        trigger_price: order.price,
        order_link_id: position.id,
        ordertype: "Conditions",
        stop_px: order.price,
        base_price: order.stopLoss,
        tp_trigger_by: "LastPrice",
        trigger_by: "LastPrice",
        sl_trigger_by: "LastPrice"
      };
      let newOrder = await this.instance.createOrder("BTC/USD", "market", order.side, order.size, 0, params);
      this._orders.push(newOrder)
      this.emit("orders")
      console.log(`Order places:`, newOrder.info.order_link_id);
    } catch (error) {
      console.error(error);
    }
  } 
}
