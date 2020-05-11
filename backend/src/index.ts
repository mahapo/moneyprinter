import { Slack } from "./utils/Slack";
import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();
// import Trader from "./trader";

const main = async function () {
  try {
    console = new Slack({
      token: process.env.SLACK_TOKEN,
      channelId: process.env.SLACK_CHANNEL,
    });
    const account = new Bybit(
      {
        apiKey: process.env.BYBITID,
        secret: process.env.BYBITSECRET,
        enableRateLimit: true,
        rate_limit: 1000,
      },
      !!process.env.DEMO
    );

    const trader = new TraderLeveraged(account, {});
    await account.init();
    await account.startWebSocket();
    trader.start({
      symbol: "BTC/USD",
      leverage: 100,
      ratio: 3,
    });
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
