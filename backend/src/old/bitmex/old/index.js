'use strict';
import BitmexBot from "./BitmexBot";
import Order from "./Order";

(async function () {
  let config = {
    test: {
      bitmex: {
        apiKey: "4VxK7P_GHTHJ7ojSN8zbIX_a",
        secret: "R-x4qPZDiMGoAgOFSdiVb91fJnxar2KDMj9soYQwcUzqbmAu",
        urls: {
          api: "https://testnet.bitmex.com"
        }
      },
      telegram: ["1314469887"]
    },
    live: {
      bitmex: {
        apiKey: "KT2FgBg_Rlr3AsUYoIyFsCd0",
        secret: "Q41rxPcGWT877e-JYWPeXPmfvQOVPW-26cm2WpXQQjb6N5Vw"
      },
      telegram: ["1314469887", "1224453217", "1397659308"]
    }
  }

  let bitmexBot = await new BitmexBot(config.live);
  // await bitmexBot.makeOrder("BTC/USD", "buy", 6000, "test");
})();
