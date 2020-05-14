import * as socketio from "socket.io";
import * as wildcard from "socketio-wildcard";
import * as socketsState from "./state";
import * as handlers from "./handlers";
// import * as pubsub from 'src/common/pubsub';

// pubsub.on('outgoing_socket_message', ({ event, id, args }) =>
//   socketsState.emit({ event, id, args }),
// );

type SocketMiddleware = (
  socket: socketio.Socket,
  next: (err?: Error) => void
) => any;

const onConnection: SocketMiddleware = (socket, next) => {
  const { id } = socket;

  console.log(id);

  socketsState.add(id, socket);

  socket.on("*", ({ data }) => {
    const [event, args] = data;
    const handler = handlers[event];
    console.log(event);

    if (!handler) {
      return null;
    }

    return handler && handler({ id, args });
  });

  socket.on("disconnect", () => {
    return socketsState.remove(id, socket);
  });

  return next();
};

const initSocket = (instance: socketio.Namespace): socketio.Namespace =>
  instance.use(wildcard()).use(onConnection);

export { initSocket };
