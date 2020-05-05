import { Backtester, TraderLeveraged } from "./runners";
import { Phemex, Faker } from "./exchanges";

const app = require("http").createServer();
const io = require("socket.io")(app);

app.listen(5000);

let urls = {
  api: {
    public: "https://testnet.phemex.com/api",
    public2: "https://testnet-api.phemex.com",
    private: "https://testnet-api.phemex.com",
  },
};
let config = {
  apiKey: process.env.ID2,
  secret: process.env.SECRET2,
  urls,
};

(async () => {
  const account = new Phemex(config);
  const trader = new TraderLeveraged(account, {});
  account.init();

  const backtester = new Backtester();
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

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    // Backtester Events
    socket.emit("files", files);
    socket.on("backtestStart", backtester.start);

    // Trader
    socket.on("botStart", (options) => trader.start(options));

    socket.emit("markets", account.markets);

    socket.emit("orders", account.orders);
    account.on("orders", () => socket.emit("orders", account.orders));
    socket.on("orders", () => socket.emit("orders", account.orders));

    socket.emit("positions", account.positions);
    account.on("positions", () => socket.emit("positions", account.positions));
    socket.on("positions", () => socket.emit("positions", account.positions));

    account.on("tick", (tick) => socket.emit("tick", tick));

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
