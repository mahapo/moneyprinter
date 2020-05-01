import { Backtester, TraderLeveraged } from "./runners";
import { Phemex, Faker } from "./exchanges";

const app = require("http").createServer();
const io = require("socket.io")(app);

app.listen(5000);

(async () => {
  // let urls = {
  //   api: {
  //     public: "https://testnet.phemex.com/api",
  //     public2: "https://testnet-api.phemex.com",
  //     private: "https://testnet-api.phemex.com",
  //   },
  // };
  // let config = {
  //   apiKey: process.env.ID2,
  //   secret: process.env.SECRET2,
  //   urls,
  // };
  // const account = new Phemex(config);

  const backtester = new Backtester();
  backtester.setMaxListeners(100);
  const files = await backtester.getFiles();

  try {
    backtester.on("backtestUpdate", (update) =>
      io.sockets.emit("backtestUpdate", update)
    );
    backtester.on("backtestFinish", (data) =>
      io.sockets.emit("backtestFinish", data)
    );
  } catch (error) {
    console.error(error);
  }
  // const trader = new TraderLeveraged(account, {
  //   product: "BTCUSD",
  //   strategyType: "",
  // });
  // trader.start();

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    // Backtester Events
    // socket.on("files", backtester.getFiles.bind(backtester));
    socket.emit("files", files);

    socket.on("backtestStart", (options) => {
      console.log(options);
      backtester.start(options);
    });

    // socket.on("orders", () => {
    //   socket.emit("orders", Array.from(account.orders.values()));
    // });
    // account.on("order_added", () =>
    //   socket.emit("orders", Array.from(account.orders.values()))
    // );
    // account.on("order_updated", () =>
    //   socket.emit("orders", Array.from(account.orders.values()))
    // );

    // socket.on("positions", () => {
    //   socket.emit("positions", Array.from(account.positions.values()));
    // });
    // account.on("position_updated", () =>
    //   socket.emit("positions", Array.from(account.positions.values()))
    // );
    // account.on("position_updated", () =>
    //   socket.emit("positions", Array.from(account.positions.values()))
    // );

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
})();
