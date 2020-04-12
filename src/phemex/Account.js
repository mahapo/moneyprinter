import Phemex from "../../ccxt/js/phemex";

export default class PhemexAccount extends Phemex {
  constructor(config) {
    this.super(config);
    this.instance = new Phemex(config);
  }

  async fundAll(amount) {
    let data = await this.instance.request(
      "phemex-user/margins",
      "private",
      "PUT",
      {
        amount,
        moveOp: 2,
      }
    );
    console.log(data);
  }

  async children() {
    let { data } = await this.instance.request(
      "phemex-user/users/children",
      "private"
    );
    return data;
  }

  async setLeverage(symbol = "BTCUSD", leverage = 20) {
    let data = await this.instance.request(
      "positions/leverage",
      "private",
      "PUT",
      { symbol, leverageEr: leverage * 100000000 }
    );
  }

  createStopLimitOrder() {
    return this.instance.privatePostOrders({
      symbol: "BTCUSD",
      clOrdID: "ii",
      side: "Buy",
      ordType: "StopLimit",
      orderQty: 1000,
      priceEp: 90000000,
      triggerType: "ByLastPrice",
      stopPxEp: 90000000,
      closeOnTrigger: false,
      reduceOnly: false,
      pegPriceType: "UNSPECIFIED",
      timeInForce: "ImmediateOrCancel",
      takeProfitEp: 100000000,
      stopLossEp: 0,
      text: "Whatsup",
    });
  }
}
