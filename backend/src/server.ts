// import * as moduleAlias from "module-alias";

// moduleAlias.addAliases({
//   src: __dirname,
// });

import * as socketio from "socket.io";
import * as http from "http";
import { initSocket } from "./socket";
import * as killPort from "kill-port";
import * as cluster from "cluster";
import { spawn } from "./clusters";

const port = 5000;

if (cluster.isMaster && false) {
  killPort(port).then(spawn);
} else {
  const server = http.createServer();
  const io = initSocket(socketio(server));

  server.listen(port, () => {
    console.log(`Listening on port ${port}.`);
  });
}
