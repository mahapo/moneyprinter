export class OrderGenerator {
  constructor(public order) {
    
  }

  get otherSide() {
    return this.order.side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY';
  }

  get commonSettings() {
    return {
      "securityType": "USDT_FUTURES",
      "positionSide": "BOTH",
      "quantity": this.order.amount,
      "timeInForce": "GTC",
      "symbol": this.order.symbol,
    }
  }

  get commonSettingsStop() {
    return {
      "reduceOnly": true,
      "priceProtect": false,
      "side": this.otherSide,
      // "workingType": "MARK_PRICE",
      "firstDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
      "firstTrigger": "PLACE_ORDER",
      "secondDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
      "secondTrigger": "CANCEL_ORDER",
    }
  }

  get mainOrder() {
    return {
      ...this.commonSettings,
      "strategySubId": 1,
      "firstDrivenId": 0,
      "secondDrivenId": 0,
      "type": "LIMIT",
      "side": this.order.side.toUpperCase(),
      "price": String(this.order.price),

    }
  }

  get takeProfit() {
    return {
      ...this.commonSettings,
      ...this.commonSettingsStop,
      "strategySubId": 2,
      "firstDrivenId": 1,
      "secondDrivenId": 3,
      "type": "TAKE_PROFIT_MARKET",
      "stopPrice": this.order.takeProfit,
    }
  }

  get stopLoss() {
    return {
      ...this.commonSettings,
      ...this.commonSettingsStop,
      "strategySubId": 3,
      "firstDrivenId": 1,
      "secondDrivenId": 2,
      "type": "STOP_MARKET",
      "stopPrice": this.order.stopLoss,
    }
  }

  get output() {
    return [
      this.mainOrder,
      this.takeProfit,
      this.stopLoss,
    ]
  }
}

// [
//     {
//       "strategySubId": 2,
//       "firstDrivenId": 1,
//       "secondDrivenId": 3,
//       "securityType": "USDT_FUTURES",
//       "firstDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
//       "timeInForce": "GTE_GTC",
//       "firstTrigger": "PLACE_ORDER",
//       "workingType": "MARK_PRICE",
//       "quantity": 1,
//       "reduceOnly": true,
//       "symbol": "BTCUSDT",
//       "type": "TAKE_PROFIT_MARKET",
//       "side": "SELL",
//       "positionSide": "BOTH",
//       "secondDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
//       "secondTrigger": "CANCEL_ORDER",
//       "stopPrice": 21000,
//       "priceProtect": false
//     },
//     {
//       "strategySubId": 3,
//       "firstDrivenId": 1,
//       "secondDrivenId": 2,
//       "securityType": "USDT_FUTURES",
//       "firstDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
//       "timeInForce": "GTE_GTC",
//       "firstTrigger": "PLACE_ORDER",
//       "workingType": "MARK_PRICE",
//       "quantity": 1,
//       "reduceOnly": true,
//       "symbol": "BTCUSDT",
//       "type": "STOP_MARKET",
//       "side": "SELL",
//       "positionSide": "BOTH",
//       "secondDrivenOn": "PARTIALLY_FILLED_OR_FILLED",
//       "secondTrigger": "CANCEL_ORDER",
//       "stopPrice": 19000,
//       "priceProtect": false
//     }
//   ]