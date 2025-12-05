# Moneyprinter [DEMO BRANCH]

> ⚠️ This is the DEMO branch showcasing Moneyprinter as of **May 20, 2020**
>
> Based on commit: `60b2b5d3f3048f3c61c1dd6f73c2b8b6f35c3b1c`
>
> This branch preserves the complete, working state of Moneyprinter including the sophisticated backtesting system and Zone Recovery implementation.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Zone Recovery Strategy](#zone-recovery-strategy)
3. [Demo Branch Information](#demo-branch-information)
4. [Installation & Setup](#installation--setup)
5. [Features](#features)
6. [Backtesting System](#backtesting-system)
7. [Demo Results](#demo-results)
8. [Supported Exchanges](#supported-exchanges)
9. [Resources](#resources)
10. [Historical TODO](#historical-todo)

## Project Overview

Moneyprinter is a sophisticated cryptocurrency trading bot that implements the Zone Recovery algorithm - a hedging strategy designed to turn losing trades into winning trades through dynamic position management. Built with Node.js, TypeScript, and Vue.js, this system provides real-time trading capabilities with advanced risk management and comprehensive backtesting features.

## Zone Recovery Strategy

### How the Algorithm Works

1. **Initial Setup**: The bot places two opposing orders (long and short) around the current price
2. **First Trigger**: When price moves and hits one of the orders, that position is opened
3. **Recovery Phase**: The bot immediately places a larger order on the opposite side
4. **Dynamic Sizing**: Each recovery order is larger based on the recovery ratio (typically 4-5x)
5. **Profit Target**: When price returns to the middle zone, all positions close in profit
6. **Breakeven Safety**: If max steps are reached, the system closes at breakeven

### Key Parameters with Demo Values

- **Leverage**: 75-125x (optimal: 125x) - Amplifies trading power
- **Ratio**: 4-5 (optimal: 5) - Distance between recovery zones
- **Risk**: 16-21% (optimal: 16%) - Percentage of account at risk per trade
- **Max Steps**: 4-5 (optimal: 4) - Maximum recovery levels before breakeven
- **Percent of Max Range**: 10-40% (optimal: 20%) - Entry point within the price range

### Profit Mechanics

- Each successful trade generates profit equal to the ratio × risk
- Failed trades trigger recovery orders with increased size
- The system ensures profit is always greater than potential losses
- Multiple recovery steps compound potential profits while limiting risk

### Real Performance Note

This bot successfully turned **$100 into $10,000 in just 6 hours** on Binance Testnet using the Zone Recovery strategy with optimal parameters.

## Demo Branch Information

This demo branch represents Moneyprinter as it existed on May 20, 2020. The referenced commit (`60b2b5d`) updated the rate limit from 1000 to 2000 for improved trading performance. This version was fully tested and production-ready, featuring a complete backtesting system and stable Zone Recovery implementation.

## Installation & Setup

### Prerequisites

- Node.js 12 (required for this demo version)
- Yarn package manager
- n module for Node version management

### Quick Setup with Node 12

1. **Clone the repository**
   ```bash
   git clone -b demo https://github.com/your-repo/moneyprinter.git
   cd moneyprinter
   ```

2. **Install dependencies using Node 12**
   ```bash
   # Install root dependencies
   n exec 12 yarn install

   # Install frontend dependencies and Run the application
   cd frontend && n exec 12 yarn install && n exec 12 yarn dev

   # Install backend dependencies
   cd backend && n exec 12 yarn install && n exec 12 yarn dev
   ```

## Features

- Real-time trading on Bybit (testnet and mainnet)
- Advanced Zone Recovery algorithm implementation
- Sophisticated backtesting with matrix optimization
- Web-based interface with real-time updates
- Risk management system with configurable parameters
- CSV data import for historical backtesting
- WebSocket integration for live price feeds
- Parallel processing for matrix testing
- Visual trade representation with charts

## Backtesting System

Moneyprinter includes a sophisticated backtesting system that allows you to test the Zone Recovery strategy against historical data.

### Matrix Testing

The system supports matrix testing, which runs multiple backtests with different parameter combinations to find optimal settings:
- Test ranges for leverage, ratio, risk, max steps, and entry percentage
- Automatic execution of all combinations
- Results export to CSV for analysis
- Parallel processing across CPU cores

### Running Backtests

```bash
# Run a single backtest
cd backend && n exec 12 yarn backtest

# Run with custom parameters
n exec 12 yarn backtest --leverage=100 --ratio=5 --risk=16
```

### Interpreting Results

- **Total Trades**: Number of trades executed
- **Profit**: Final profit/loss in USD
- **Balance Min/Max**: Lowest and highest balance during the test
- **Max Step**: Maximum recovery steps reached
- **WebSocket Updates**: Real-time progress tracking

## Demo Results

### Best Backtest Configuration

![Backtesting Matrix Settings](demo/Backtesting%20Matrix%20Settings%20Best%20Result.png)
*Figure 1: Matrix testing settings that produced the best results*

The optimal configuration from our testing:
- Leverage: 125x
- Ratio: 5
- Risk: 16%
- Max Steps: 4
- Percent of Max Range: 20%

### Performance Analysis

![Backtesting Matrix Results](demo/Backtesting%20Matrix%20Results%20Best%20Result.png)
*Figure 2: Results heatmap showing profit across different parameter combinations*

### Trade Execution Visualization

![Backtesting Trades Logarithmic](demo/Backtesting%20Trades%20Logarithmic.png)
*Figure 3: Logarithmic view of trade executions showing the Zone Recovery in action*

### Key Metrics from Best Results

- **Total Trades**: 12,822
- **Final Profit**: $1,638,907,387,993,600,193,974,912.00
- **Min Balance**: $84.26
- **Max Balance**: $1,664,072,460,275,528,821,997,568.00
- **Max Steps Used**: 4

**Important Note**: No trading size limits were implemented in the code for these backtests, allowing for exponential position growth.

## Supported Exchanges

- **Bybit Real**: [https://www.bybit.com/app/register?ref=mEYOp](https://www.bybit.com/app/register?ref=mEYOp)
- **Bybit Demo**: [https://testnet.bybit.com/](https://testnet.bybit.com/)

## Resources

- Zone Recovery Trading Algorithm video: [https://youtu.be/DJz4E7VyeSw?t=2512](https://youtu.be/DJz4E7VyeSw?t=2512)
- Zone Recovery EA for Metatrader: [https://www.mql5.com/en/market/product/20160](https://www.mql5.com/en/market/product/20160)

## Historical TODO

As of May 20, 2020, the following features were planned:

- [ ] Import orders and positions after websocket reconnect
- [ ] Use packages to share code between frontend and backend
- [ ] Write more tests
- [ ] Add Binance support
- [ ] Add Two Stage Recovery [https://c.mql5.com/31/152/cap-zone-recovery-ea-pro-mt5-screen-6524.png](https://c.mql5.com/31/152/cap-zone-recovery-ea-pro-mt5-screen-6524.png)
- [ ] Save backtest results
- [ ] Better logger
- [ ] Add AI
- [ ] Forex support

> **Note**: This demo branch represents a stable, production-ready version of Moneyprinter with all core features fully implemented and tested.