import StrategyTester from "./StrategyTester";
import HedgeOrder from "./HedgeOrder";

(async function() {
  let tester = new StrategyTester();
  await tester.loadDemo();
  for (let ratio = 2; ratio < 100; ratio++) {
    tester.runTest(ratio);
    console.log(`Ratio: ${ratio} Win: ${tester.stats.totalWin}`);
    tester.reset();
  }
})();
