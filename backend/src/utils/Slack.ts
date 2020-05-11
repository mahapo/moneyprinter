import { WebClient } from "@slack/web-api";
const { Console } = require("console");
export class Slack {
  channelId: string;
  client: WebClient;

  constructor({ token, channelId }) {
    // super()

    this.client = new WebClient(token);
    this.channelId = channelId;
  }

  send(text, options = {}) {
    return this.client.chat.postMessage({
      channel: this.channelId,
      text,
      ...options,
    });
  }

  log(...text) {
    return this.send(text.join(" "));
  }

  debug(...text) {
    return this.send(text.join(" "));
  }

  error(...text) {
    return this.send(text.join(" "));
  }

  info(...text) {
    return this.send(text.join(" "));
  }

  signal(signal) {
    return this.send("New signal", {
      blocks: [
        {
          type: "section",
          fields: Object.keys(signal).map((key) => ({
            type: "mrkdwn",
            text: `*${key.toUpperCase()}:*\n${signal[key]}`,
          })),
        },
      ],
    });
  }
}
