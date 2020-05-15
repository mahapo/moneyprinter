import { Backtester } from "../runners";

process.on("message", ({ options, matrix }) => {
  const backtester = new Backtester();
  if (options.matrix) {
    backtester.startMatrix(options, matrix);
    backtester.on("backtestFinishMatrix", (result) => process.send(result));
  } else {
    backtester.start(options);
    backtester.on("backtestFinish", (result) => process.send(result));
  }
});
