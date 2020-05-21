const ccxt = require("ccxt");
const fs = require("fs");

(async () => {
  const exchange = "binance";
  const instance = new ccxt[exchange]();
  const markets = await instance.fetchMarkets();
  fs.writeFile(
    `./data/exchange/${exchange}.json`,
    JSON.stringify(markets),
    "utf8",
    function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("File created");
      }
    }
  );
})();
