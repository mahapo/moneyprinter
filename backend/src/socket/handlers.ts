import * as socketsState from "./state";
import { Backtester } from "../runners";

interface Handlers {
  [key: string]: ({ id, args }: { id: string; args: any }) => any;
}

const handlers: Handlers = {
  startBacktest: async ({ id, args }) => {
    const backtester = new Backtester();
    backtester.startMatrix(args);
    backtester.on("backtestFinishMatrix", (result) => {
      socketsState.emit({ event: "test", id, args });
    });
  },
  files: async ({ id, args }) => {
    const backtester = new Backtester();
    const files = await backtester.getFiles();
    socketsState.emit({ event: "files", id, args: files });
  },
};

export = handlers;
