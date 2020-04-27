import { Backtester } from "./runners";
import { Phemex } from "./exchanges";

const app = require("http").createServer();
const io = require("socket.io")(app);

app.listen(5000);

(async () => {
  let urls = {
    api: {
      public: "https://testnet.phemex.com/api",
      public2: "https://testnet-api.phemex.com",
      private: "https://testnet-api.phemex.com",
    },
  };
  let config = {
    apiKey: process.env.ID1,
    secret: process.env.SECRET1,
    urls,
  };
  const account = new Phemex(config);

  const tester = new Backtester(account, {
    product: "BTCUSD",
    strategyType: "",
  });

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("backtest", (data) => {
      console.log(data);
      tester.start();
    });
    tester.on("finish", (data) => socket.emit("finish", data));

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
})();
