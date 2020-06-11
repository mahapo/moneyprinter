import { OrderBybit } from "../src/models";

describe("Leverage Order", () => {
  let options = {
    timestamp: 0,
    symbol: "",
    price: 10000,
    amount: 1000,
    leverage: 50,
    ratio: 2,
  };

  test("Long by Calculatior", () => {
    const long = new OrderBybit({
      ...options,
      side: "buy",
    });
    expect(long.liquidationPrice).toBe(9852.216748768473);
    expect(long.changePriceLiquidation.toFixed(4)).toBe("147.7833");
    expect(long.feeValue.toFixed(4)).toBe("0.0025");
    expect(long.amountValue).toBe(0.1);
    expect(long.realAmount).toBe(20);

    expect(long.bankruptcyPrice).toBe(9800);

    long.priceExit = 11000;

    expect(long.profitLossPercentage.toFixed(4)).toBe("9.0909");
    expect(long.profitLossValue.toFixed(4)).toBe("0.0091");
    expect(long.profit.toFixed(4)).toBe("90.9091");

    long.priceExit = 9000;

    expect(long.profitLossPercentage.toFixed(4)).toBe("-11.1111");
    expect(long.profitLossValue.toFixed(4)).toBe("-0.0111");
    expect(long.profit.toFixed(4)).toBe("-111.1111");
  });

  test("Sell by Calculatior", () => {
    const short = new OrderBybit({
      ...options,
      side: "sell",
    });
    expect(short.liquidationPrice).toBe(10152.284263959391);
    expect(parseFloat(short.feeValue.toFixed(6))).toBe(0.0025);
    expect(short.amountValue).toBe(0.1);
    expect(short.realAmount).toBe(20);
    expect(short.bankruptcyPrice).toBe(10200);

    short.priceExit = 9000;

    expect(short.profitLossPercentage.toFixed(4)).toBe("-11.1111");
    expect(short.profitLossValue.toFixed(4)).toBe("-0.0111");
    expect(short.profit.toFixed(4)).toBe("-111.1111");
  });

  const options2 = {
    timestamp: 0,
    symbol: "",
    price: 5000,
    amount: 4000,
    leverage: 50,
    ratio: 2,
  };

  //https://help.bybit.com/hc/en-us/articles/360039260694-Unrealized-Profit-Loss-Calculation-Inverse-Contract-

  test("Long", () => {
    const long = new OrderBybit({
      ...options2,
      side: "buy",
    });
    long.priceExit = 5500;

    expect(long.uPNLValue.toFixed(4)).toBe("0.0727");
  });

  test("Short", () => {
    const long = new OrderBybit({
      ...options2,
      side: "sell",
    });
    long.priceExit = 4500;

    expect(long.uPNLValue.toFixed(4)).toBe("0.0889");
  });

  // https://help.bybit.com/hc/en-us/articles/360039749573-Profit-Loss-Inverse-Contract-

  test("Fees", () => {
    const long = new OrderBybit({
      ...options2,
      side: "sell",
    });
    long.priceExit = 5100;

    expect(long.uPNLValue.toFixed(4)).toBe("-0.0157");
    expect(long.feeToOpen.toFixed(4)).toBe("0.0006");
    expect(long.feeToClose.toFixed(8)).toBe("0.00058824");
    expect(long.closedProfitValue.toFixed(8)).toBe("-0.01687451");
    // expect(long.closedProfit.toFixed(8)).toBe("-0.01687451");
  });

  test("Real trade long", () => {
    const long = new OrderBybit({
      timestamp: 0,
      symbol: "",
      price: 9204.13,
      amount: 23,
      leverage: 50,
      ratio: 2,
      side: "buy",
    });
    long.priceExit = 9203.53;

    expect(long.closedProfitValue.toFixed(8)).toBe("-0.00000391");
  });

  test("Real trade long", () => {
    const long = new OrderBybit({
      timestamp: 0,
      symbol: "",
      price: 9170.99,
      amount: 84,
      leverage: 50,
      ratio: 2,
      side: "sell",
    });
    long.priceExit = 9196.01;

    expect(long.closedProfitValue.toFixed(6)).toBe("-0.000039");
  });

  test("Ratio 2 buy", () => {
    const long = new OrderBybit({
      timestamp: 0,
      symbol: "BTC/USD",
      price: 10000,
      amount: 10000,
      leverage: 100,
      ratio: 2,
      side: "buy",
    });

    expect(long._closedProfitValue(10000).toFixed(4)).toBe("-0.0015");
    expect(long._closedProfitValue(10010).toFixed(4)).toBe("-0.0005");
    expect(long._closedProfitValue(10020).toFixed(4)).toBe("0.0005");
    expect(long._closedProfitValue(9950.25).toFixed(4)).toBe("-0.0065");
    expect(long.liquidationPrice.toFixed(2)).toBe("9950.25");

    long.setStopLoss(50);
    expect(long.stopLoss.toFixed(2)).toBe("9975.12");

    long.setTakeProfit(2);
    expect(long.takeProfit.toFixed(1)).toBe("10096.0");
  });

  test("Ratio 3 sell", () => {
    const long = new OrderBybit({
      timestamp: 0,
      symbol: "BTC/USD",
      price: 10000,
      amount: 10000,
      leverage: 100,
      ratio: 3,
      side: "sell",
    });

    expect(long.liquidationPrice.toFixed(2)).toBe("10050.25");

    long.setStopLoss(50);
    expect(long.stopLoss.toFixed(2)).toBe("10025.13");

    long.setTakeProfit(3);
    expect(long.takeProfit.toFixed(1)).toBe("9866.5");
  });
});
