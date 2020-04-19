import ccxt from "ccxt";

export default class Account {
  constructor(config) {
    this.config = config
  }

  async init() {
    this.account = await new ccxt.bitmex(this.config)
  }

  async getBalance() {
    this.balance = await this.account.fetchBalance();
    return this.balance
  }
}