import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as csv from "csv-parser";

import { EventEmitter } from "events";
import { performance } from "perf_hooks";

export class Faker extends EventEmitter {
  progress: number = 0;

  async init() {}

  async startTicker({ file }) {
    this.emit("update", {
      progress: 0,
      text: "Loading ticks",
    });

    let ticks = await this.getTestTickes(file);
    this.emit("update", {
      text: `Test Strategy on ${ticks.length} Ticket`,
    });
    const t0 = performance.now();
    let count = 0;
    let progressOld = 0;

    for (let tick of ticks) {
      this.emit("tick", tick);

      progressOld = this.progress;
      this.progress = Math.max(
        Math.round((count++ / ticks.length) * 100),
        this.progress
      );
      if (progressOld !== this.progress) {
        console.log(this.progress);
        this.emit("update", {
          progress: this.progress,
        });
      }
    }
    const t1 = performance.now();
    console.log("Call to ticker took " + (t1 - t0) + " milliseconds.");
    this.emit("update", {
      progress: 100,
      text: `Test finished`,
    });
    this.emit("finish");
    console.log("finish");
  }

  async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath);

    return results.map((tick) => {
      const time = new Date(parseFloat(tick.unix));
      // @ts-ignore
      time.setHours(...tick.date.split(":").join(".").split("."));

      return {
        time,
        price: parseFloat(tick.price),
        volume: parseFloat(tick.amount),
      };
    });
  }

  async loadCSV(filePath): any[] {
    let data = [];
    console.log(filePath);

    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (d) => data.push(d))
        .on("end", () => resolve(data));
    });
  }

  getFiles() {
    glob("./data/*.csv", {}, (er, files) => {
      this.emit(
        "files",
        files.map((file) => ({
          text: path.parse(file).name,
          value: file,
        }))
      );
    });
  }
}
