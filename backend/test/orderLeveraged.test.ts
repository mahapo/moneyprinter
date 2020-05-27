import { OrderLeveraged } from "../src/models";

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
    const long = new OrderLeveraged({
      ...options,
      side: "buy",
    });
    expect(long.liquidationPrice).toBe(9852.216748768473);
    expect(parseFloat(long.feeValue.toFixed(6))).toBe(0.0025);
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
    const short = new OrderLeveraged({
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
    const long = new OrderLeveraged({
      ...options2,
      side: "buy",
    });
    long.priceExit = 5500;

    expect(long.uPNLValue.toFixed(4)).toBe("0.0727");
  });

  test("Short", () => {
    const long = new OrderLeveraged({
      ...options2,
      side: "sell",
    });
    long.priceExit = 4500;

    expect(long.uPNLValue.toFixed(4)).toBe("0.0889");
  });

  // https://help.bybit.com/hc/en-us/articles/360039749573-Profit-Loss-Inverse-Contract-

  test("Fees", () => {
    const long = new OrderLeveraged({
      ...options2,
      side: "sell",
    });
    long.priceExit = 5100;

    expect(long.uPNLValue.toFixed(4)).toBe("-0.0157");
    expect(long.feeToOpen.toFixed(4)).toBe("0.0006");
    expect(long.feeToClose.toFixed(8)).toBe("0.00058824");
    expect(long.closedProfit.toFixed(8)).toBe("-0.01687451");
  });
});
