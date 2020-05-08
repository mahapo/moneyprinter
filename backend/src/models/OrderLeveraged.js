"use strict";
// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js
exports.__esModule = true;
var colors = require("colors/safe");
function round(value, step) {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
}
var OrderLeveraged = /** @class */ (function () {
    function OrderLeveraged(_a) {
        var price = _a.price, time = _a.time, size = _a.size, leverage = _a.leverage, _b = _a.ratio, ratio = _b === void 0 ? 1 : _b, _c = _a.side, side = _c === void 0 ? "buy" : _c;
        this.price = price;
        this.time = time;
        this.size = size;
        this.leverage = leverage;
        this.ratio = ratio;
        this.side = side;
        this.maintenanceMargin = 0.005;
        this.takeProfit = this.takeProfitSuggestion;
        this.stopLoss = this.stopLossSuggestion;
    }
    Object.defineProperty(OrderLeveraged.prototype, "basePrice", {
        get: function () {
            if (this.side === "buy")
                return this.price - 0.5;
            return this.price + 0.5;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "formatedTime", {
        get: function () {
            return this.time.toLocaleString();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "adjustedLong", {
        get: function () {
            return (this.maintenanceMargin - (1 / this.leverage) * this.maintenanceMargin);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "adjustedShort", {
        get: function () {
            return (this.maintenanceMargin + (1 / this.leverage) * this.maintenanceMargin);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "changePriceBankruptcyPercent", {
        // Change in Price to Bankruptcy (%)
        get: function () {
            if (this.side === "buy")
                return (1 / (this.leverage + 1)) * -1 * 100;
            return (1 / (this.leverage - 1)) * 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "changePriceLiquidationPercent", {
        // Change in Price to Liquidation (%)
        get: function () {
            if (this.side === "buy")
                return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
            return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "liquidationPrice", {
        // Liquidation Price
        get: function () {
            if (this.side === "buy")
                return round(this.price + (this.price * this.changePriceLiquidationPercent) / 100, 0.0001);
            return round(this.price + (this.price * this.changePriceLiquidationPercent) / 100, 0.0001);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "changePriceLiquidation", {
        // Change in Price to Liquidation ($)
        get: function () {
            return (this.price - this.liquidationPrice) * -1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "takeProfitSuggestion", {
        get: function () {
            if (this.side === "buy")
                return round(this.price + 15, 0.5);
            return round(this.price - 15, 0.5);
            // if (this.side === "buy")
            //   return round(
            //     this.price + Math.abs(this.changePriceLiquidation) * this.ratio,
            //     0.5
            //   );
            // return round(
            //   this.price - Math.abs(this.changePriceLiquidation) * this.ratio,
            //   0.5
            // );
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "stopLossSuggestion", {
        get: function () {
            if (this.side === "buy")
                return this.liquidationPrice + 5;
            return this.liquidationPrice - 5;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "takeProfitPercent", {
        get: function () {
            return (this.takeProfit / this.price) * 100 - 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "stopLossPercent", {
        get: function () {
            return (this.stopLoss / this.price) * 100 - 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "maxWin", {
        get: function () {
            if (this.side === "buy")
                return (this.size / this.leverage) * this.takeProfitPercent;
            return (this.size / this.leverage) * this.takeProfitPercent * -1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderLeveraged.prototype, "maxLoss", {
        get: function () {
            if (this.side === "buy")
                return (this.size / this.leverage) * this.stopLossPercent;
            return (this.size / this.leverage) * this.stopLossPercent * -1;
        },
        enumerable: true,
        configurable: true
    });
    OrderLeveraged.prototype.toString = function () {
        var colored = this.side === "buy" ? colors.green("L") : colors.red("S");
        return colored + " " + this.size + " @ " + this.price + " TP:" + this.takeProfit + " SL:" + this.stopLoss;
    };
    OrderLeveraged.prototype.clone = function () {
        var order = new OrderLeveraged({
            price: this.price,
            time: this.time,
            size: this.size,
            leverage: this.leverage,
            side: this.side
        });
        order.takeProfit = this.takeProfit;
        order.stopLoss = this.stopLoss;
        return order;
    };
    return OrderLeveraged;
}());
exports.OrderLeveraged = OrderLeveraged;
