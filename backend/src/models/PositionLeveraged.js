"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var colors = require("colors/safe");
var _1 = require("./");
var PositionLeveraged = /** @class */ (function (_super) {
    __extends(PositionLeveraged, _super);
    function PositionLeveraged(_a) {
        var order = _a.order, id = _a.id;
        return _super.call(this, { order: order, id: id }) || this;
    }
    PositionLeveraged.prototype.onTick = function (_a) {
        var price = _a.price, time = _a.time;
        if (this.status === "open") {
            if ((this.order.side === "buy" && this.order.price <= price) ||
                (this.order.side === "sell" && this.order.price >= price)) {
                this.status = "filled";
            }
        }
        if (this.status === "filled") {
            if ((this.order.side === "buy" &&
                (this.order.takeProfit <= price || this.order.stopLoss >= price)) ||
                (this.order.side === "sell" &&
                    (this.order.takeProfit >= price || this.order.stopLoss <= price))) {
                this.status = "done";
                this.exit = price;
            }
        }
    };
    PositionLeveraged.prototype.print = function () {
        var profit = "";
        if (this.status === "done") {
            var prof = "" + this.profitString();
            var colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
            profit = "| Profit: " + colored;
        }
        console.log(this.order.toString() + " - " + this.status + " " + profit);
    };
    PositionLeveraged.prototype.profit = function () {
        if (this.status === "done") {
            if (this.order.side === "buy")
                return this.exit > this.order.price
                    ? this.order.maxWin
                    : this.order.maxLoss;
            else
                return this.exit < this.order.price
                    ? this.order.maxWin
                    : this.order.maxLoss;
        }
        return 0;
    };
    return PositionLeveraged;
}(_1.Position));
exports.PositionLeveraged = PositionLeveraged;
