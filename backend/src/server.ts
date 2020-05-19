import * as socketio from "socket.io";
import * as http from "http";
import { initSocket } from "./socket";
import { spawn } from "./clusters";

const port = 5000;

const server = http.createServer();
const io = initSocket(socketio(server).of("/socket"));

server.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
