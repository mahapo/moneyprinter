import StrategyTester from "./StrategyTester";

(async function() {
  let tester = new StrategyTester();
  await tester.loadDemo("gemini_BTCUSD_2018_1min.csv");
//   await tester.loadDemo();
  console.log(`From ${tester.data[0]['Date']} to ${tester.data[tester.data.length -1]['Date']}`);
  for (let ratio = 2; ratio <= 8; ratio++) {
    tester.runTest(ratio);
    console.log(`Ratio: ${ratio} Win: ${tester.stats.totalWin.toFixed(2)} Trades: ${tester.stats.trades} Win: ${tester.stats.win}`);
    tester.reset();
  }
})();
