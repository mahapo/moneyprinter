import { WebClient } from "@slack/web-api";
export class Slack {
  static channelId: string;
  static client: WebClient;

  static auth() {
    this.client = new WebClient(process.env.SLACK_TOKEN);
    this.channelId = String(process.env.SLACK_CHANNEL);
  }

  static send(text, options = {}) {
    this.auth();
    console.log(text);

    return Slack.client.chat.postMessage({
      channel: Slack.channelId,
      text,
      ...options,
    });
  }

  static log(...text) {
    return Slack.send(text.join(" "));
  }

  static debug(...text) {
    return Slack.send(text.join(" "));
  }

  static error(...text) {
    return Slack.send(text.join(" "));
  }

  static info(...text) {
    return Slack.send(text.join(" "));
  }

  static signal(signal) {
    return Slack.send("New signal", {
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
