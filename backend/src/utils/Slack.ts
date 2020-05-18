import { WebClient } from "@slack/web-api";
export class Slack {
  static channelId: string;
  static client: WebClient;

  static auth() {
    this.client = new WebClient(process.env.SLACK_TOKEN);
    this.channelId = String(process.env.SLACK_CHANNEL);
  }

  static send(text, options = {}, cannelId = null) {
    this.auth();
    console.log(text);

    return Slack.client.chat.postMessage({
      channel: cannelId || Slack.channelId,
      text,
      ...options,
    });
  }

  static log(...text) {
    return Slack.send(text.join(" "), {}, "C013RQZS693");
  }

  static debug(...text) {
    return Slack.send(text.join(" "));
  }

  static error(error) {
    console.table(error.message);
    return Slack.send(
      error.name,
      {
        blocks: [
          {
            type: "section",
            fields: Object.keys(error.message)
              .slice(0, 9)
              .map((key) => ({
                type: "mrkdwn",
                text: `*${key.toUpperCase()}:*\n${error.message[key]}`,
              })),
          },
        ],
      },
      "C014H1Q14RE"
    );
  }

  static info(...text) {
    return Slack.send(text.join(" "));
  }

  static table(...text) {
    console.table(text);

    // return Slack.send(text.join(" "));
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
