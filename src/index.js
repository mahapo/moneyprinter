import StrategyTester from "./StrategyTester";

(async function () {
  let tester = new StrategyTester(100);
  await tester.loadDemo("../data/gemini_BTCUSD_2019_1min.csv");
  //   await tester.loadDemo()
  console.log(
    `From ${tester.data[0]["Date"]} to ${
      tester.data[tester.data.length - 1]["Date"]
    }`
  );

  for (const l of [100]) {
    for (let ratio = 2; ratio <= 3; ratio++) {
      tester.calcSteps(25);
      // console.log(tester.steps);
      tester.runTest(ratio, l);
      // console.log(
      //   `${l}X: Ratio: ${ratio} EndBalance: ${tester.balance.toFixed(
      //     2
      //   )} Trades: ${tester.stats.trades} Win: ${tester.stats.win}`
      // );

      console.log(
        `${l}X: Ratio: ${ratio} Stats: ${JSON.stringify(tester.stats)}`
      );
      console.log(tester.badDates);
      tester.reset();
    }
  }
})();
