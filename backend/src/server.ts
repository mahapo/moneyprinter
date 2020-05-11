import { Backtester, TraderLeveraged } from "./runners";
// import { Bybit } from "./exchanges";
require("dotenv").config();

const app = require("http").createServer();
const io = require("socket.io")(app);

app.listen(5000);

(async () => {
  const backtester = new Backtester();
  const files = await backtester.getFiles();

  try {
    // account.startWebSocket();
    backtester.on("backtestUpdate", (update) =>
      io.sockets.emit("backtestUpdate", update)
    );
    backtester.on("backtestFinish", (data) =>
      io.sockets.emit("backtestFinish", data)
    );
  } catch (error) {
    console.log(error);
  }

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    // Backtester Events
    socket.emit("files", files);
    socket.on("backtestStart", (options) => backtester.start(options));

    // Trader
    // socket.on("botStart", (options) => trader.start(options));

    // socket.emit("markets", account.markets);

    // socket.emit("orders", account.orders);
    // account.on("orders", () => socket.emit("orders", account.orders));
    // socket.on("orders", () => socket.emit("orders", account.orders));

    // socket.emit("positions", account.positions);
    // account.on("positions", () => socket.emit("positions", account.positions));
    // socket.on("positions", () => socket.emit("positions", account.positions));

    // account.on("tick", (tick) => socket.emit("tick", tick));

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

process.on("uncaughtException", (err) => {
  console.log("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});
