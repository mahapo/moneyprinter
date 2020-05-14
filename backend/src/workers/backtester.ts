import { Backtester } from "../runners";

process.on("message", (options) => {
  console.info(`Backtester start`, options);
  const backtester = new Backtester();
  backtester.startMatrix(options);
  backtester.on("backtestFinishMatrix", (result) => process.send(result));
});
