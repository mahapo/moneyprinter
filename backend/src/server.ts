import { Backtester } from "./runners";
// import { Bybit } from "./exchanges";
require("dotenv").config();

const app = require("http").createServer();
const io = require("socket.io")(app);

app.listen(5000);

(async () => {
  const backtester = new Backtester();
  const files = await backtester.getFiles();

  // ["backtestFinishMatrix"].forEach((event) => {
  //   backtester.on(event, (...args) => io.sockets.emit(event, ...args));
  // });

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    // Backtester Events
    socket.emit("files", files);
    socket.on("files", () => socket.emit("files", files));
    socket.on("backtestStart", (options) => backtester.start(options));
    socket.on("backtestMatrix", (options) => backtester.startMatrix(options));

    ["backtestUpdate", "backtestFinish", "backtestFinishMatrix"].forEach(
      (event) => {
        backtester.on(event, (...args) => socket.emit(event, ...args));
      }
    );

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
})();

process.on("uncaughtException", (err) => {
  console.log("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});
