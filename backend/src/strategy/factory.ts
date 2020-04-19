import { MoneyPrinter } from "./MoneyPrinter";

export const create = function (type, data) {
  return new MoneyPrinter(data);
  // switch (type) {
  //   case "macd":
  //     return new MACD(data);
  //   case "simple":

  //   default:
  //     return new MACD(data);
  // }
};
