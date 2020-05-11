import { WebClient } from "@slack/web-api";

export class Slack {
  channelId: string;
  client: WebClient;

  constructor({ token, channelId }) {
    console.log(token);

    this.client = new WebClient(token);
    this.channelId = channelId;
  }

  send(text) {
    return this.client.chat.postMessage({
      channel: this.channelId,
      text,
    });
  }
}
