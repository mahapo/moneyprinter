import * as socketsState from "./state";
import { Backtester } from "../runners";
import { ChildProcess, fork } from "child_process";
import * as path from "path";

interface Handlers {
  [key: string]: ({ id, args }: { id: string; args: any }) => any;
}

const handlers: Handlers = {
  startBacktest: async ({ id, args }) => {
    // TODO: Multi Core Process
    const process = await startProcess("../workers/backtester.ts", args);
    process.on("message", (result) => {
      socketsState.emit({
        event: "backtestFinishMatrix",
        id,
        args: result,
      });
    });
  },
  files: async ({ id, args }) => {
    // TODO: Move csv to utils
    const backtester = new Backtester();
    const files = await backtester.getFiles();
    socketsState.emit({ event: "files", id, args: files });
  },
};

function startProcess(file, args): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const process = fork(path.resolve(__dirname, file), [], {
      execArgv: ["-r", "ts-node/register"],
    });
    process.send(args);
    return resolve(process);
  });
}

export = handlers;
