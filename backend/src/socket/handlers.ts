import * as socketsState from "./state";
import { Backtester } from "../runners";
import { ChildProcess, fork } from "child_process";
import * as path from "path";
import { Matrix } from "../utils";
import * as os from "os";
interface Handlers {
  [key: string]: ({ id, args }: { id: string; args: any }) => any;
}

const handlers: Handlers = {
  startBacktest: async ({ id, args }) => {
    const process = await startProcess("../workers/backtester.ts", {
      options: args,
    });
    process.on("message", (result) => {
      socketsState.emit({
        event: "backtestFinish",
        id,
        args: result,
      });
    });
  },
  startBacktesthMatrix: async ({ id, args }) => {
    if (args.multi) {
      const numWorkes = os.cpus().length;
      let matrix = Matrix.createTestMatrix(args.matrix, numWorkes);

      for (let i = 0; i < numWorkes; i += 1) {
        const process = await startProcess("../workers/backtester.ts", {
          options: args,
          matrix: matrix[i],
        });
        process.on("message", (result) => {
          socketsState.emit({
            event: "backtestFinishMatrix",
            id,
            args: result,
          });
        });
      }
    } else {
      let matrix = Matrix.createTestMatrix(args.matrix);
      const process = await startProcess("../workers/backtester.ts", {
        options: args,
        matrix: matrix,
      });
      process.on("message", (result) => {
        socketsState.emit({
          event: "backtestFinishMatrix",
          id,
          args: result,
        });
      });
    }
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
