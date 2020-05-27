import { MoneyPrinter } from "../src/strategy/MoneyPrinter";

describe("MoneyPrinter via Backtester", () => {
  const Strategy = new MoneyPrinter(null);
  const prices = [10000, 10030, 10020];
  const options = {
    timestamp: 0,
    amount: 100,
    leverage: 100,
    symbol: "",
    ratio: 2,
  };

  test("Signal create orders", () => {
    Strategy.onSignal({ price: prices[0], ...options });
    expect(Strategy.currentOrders.length).toBe(2);
  });

  test("Other signal don't create new orders", () => {
    Strategy.onSignal({ price: prices[0], ...options });
    expect(Strategy.currentOrders.length).toBe(2);
    expect(Strategy.currentOrders[0].amount).toBe(options.amount);
    expect(Strategy.currentOrders[1].amount).toBe(options.amount);
  });

  test("After long order is filled", () => {
    Strategy.onOrderFilled(Strategy.currentOrders[0]);
    expect(Strategy.side).toBe("buy");
    expect(Strategy.countFilled).toBe(1);
    expect(Strategy.currentOrders.length).toBe(2);
  });

  test("After short order is filled", () => {
    Strategy.currentOrders[1].filled = Strategy.currentOrders[1].amount;
    expect(Strategy.nextSide).toBe("sell");
    Strategy.onOrderFilled(Strategy.currentOrders[1]);
    expect(Strategy.countFilled).toBe(2);
    expect(Strategy.currentOrders.length).toBe(3);
    expect(Strategy.currentOrders[2].amount).toBe(options.amount * 2);
  });
});

describe("MoneyPrinter via Trader", () => {
  const Strategy = new MoneyPrinter(null);
  const prices = [10000, 10030, 10020];
  const options = {
    timestamp: 0,
    amount: 100,
    leverage: 100,
    symbol: "",
    ratio: 2,
  };

  test("Signal create orders", () => {
    Strategy.onSignal({ price: prices[0], ...options });
    Strategy.isLive = true;
    expect(Strategy.currentOrders.length).toBe(2);
  });

  test("Other signal don't create new orders", () => {
    Strategy.onSignal({ price: prices[0], ...options });
    expect(Strategy.currentOrders.length).toBe(2);
  });

  test("After long order is filled", () => {
    Strategy.onOrderFilled(Strategy.currentOrders[0]);
    expect(Strategy.countFilled).toBe(1);
    expect(Strategy.currentOrders.length).toBe(3);
    expect(Strategy.currentOrders[2].amount).toBe(
      options.amount * 2 + Strategy.currentOrders[0].amount // 300
    );
  });

  test("After short order is filled", () => {
    Strategy.onOrderFilled(Strategy.currentOrders[1]);
    expect(Strategy.countFilled).toBe(2);
    expect(Strategy.currentOrders.length).toBe(4);
    expect(Strategy.currentOrders[3].amount).toBe(
      options.amount * 2 + Strategy.currentOrders[2].amount // 300
    );
  });
});
