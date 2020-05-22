"use strict";

const fs = require("fs");
const Path = require("path");
const Axios = require("axios");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const months = [
  "August2019",
  "September2019",
  "October2019",
  "November2019",
  "December2019",
  "January2020",
];

async function downloadCSV(symbol, month) {
  const fileName = `${symbol}USDT_${month}_Binance_prints.csv`;
  const url = `https://www.cryptodatadownload.com/cdd/tradeprints/${fileName}`;
  const folder = Path.resolve(__dirname, `../data/trades/${symbol}`);
  const path = Path.resolve(__dirname, folder, fileName);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  const writer = fs.createWriteStream(path);

  console.log(url);

  const response = await Axios({
    url,
    method: "GET",
    responseType: "stream",
    httpsAgent: agent,
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

Promise.all(months.map((month) => downloadCSV("NEO", month)));
