# Moneyprinter

## Introductions

Zone Recovery is your tool to turn losing trades into winning trades by using a smart "back-and-forth" hedging mechanism. I call it the "Never Lose Again Strategy". Let the price move to anywhere it likes - the awesome Zone Recovery will make profits out of the situation. Guaranteed! The secret behind this amazing EA is a famous trading algorithm known as "Zone recovery algorithm" or "The Surefire Forex Hedging Strategy".

## Exchanges

- Bybit Real: [https://www.bybit.com/app/register?ref=mEYOp]
- Bybit Demo: [https://testnet.bybit.com/]

## First Steps

1. clone Repo
2. create api keys for bybit testnet
3. rename `env.dist` to `.env` in backend folder and add api key to `BYBIT_ID_DEMO` and `BYBIT_SECRET_DEMO`
4. run `$ yarn` in root folder
5. run `$ yarn dev` to start frontend and server for backtesting
6. run `cd backend && yarn trader` to run bot

## ToDO

[] Import orders and positions after websocket reconnect
[] Use packages to share code between frontend and backend
[] Write more tests
[] Add Binance
[] Add Two Stange Recovery [https://c.mql5.com/31/152/cap-zone-recovery-ea-pro-mt5-screen-6524.png]
[] Print Money
[] Add AI
[] Forex ?

## Resources

- Zone Recovery Trading Algorithm video: [https://youtu.be/DJz4E7VyeSw?t=2512]
- Zone Recovery EA for Metatrader: [https://www.mql5.com/en/market/product/20160]
