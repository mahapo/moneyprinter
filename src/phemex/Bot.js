require("dotenv").config();
import Account from "./Account";

let urls = {
  api: {
    public: "https://testnet.phemex.com/api",
    public2: "https://testnet-api.phemex.com",
    private: "https://testnet-api.phemex.com",
  },
};
let config1 = {
  apiKey: process.env.ID1,
  secret: process.env.SECRET1,
  urls,
};
let config2 = {
  apiKey: process.env.ID2,
  secret: process.env.SECRET2,
  urls,
};

export default class PhemexBot {
  constructor() {
    this.accounts = [];
    this.accounts.push(new Account(config1));
    this.accounts.push(new Account(config2));
  }

  async setLeverage(symbol = "BTCUSD", leverage = 20) {
    return await this.accounts.map((account) =>
      account.setLeverage(symbol, leverage)
    );
  }
}
