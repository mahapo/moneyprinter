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
var EventEmitter = require("events");
var Position = /** @class */ (function (_super) {
    __extends(Position, _super);
    function Position(_a) {
        var order = _a.order, id = _a.id;
        var _this = _super.call(this) || this;
        _this.needsUpdate = false;
        _this.status = "open";
        _this.order = order;
        _this.id = id + "-" + order.side;
        _this.setMaxListeners(10000000);
        return _this;
        // Position.positions.set(this.id, this);
    }
    Position.prototype.close = function (_a) {
        var order = _a.order;
        this.status = "closed";
        this.exit = order;
    };
    Position.prototype.print = function () {
        var enter = "Enter | " + this.order.price + " | " + this.order.formatedTime;
        var exit = this.exit
            ? "Exit: | " + this.exit.price + " | " + this.exit.formatedTime
            : "";
        var profit = "";
        if (this.status === "closed") {
            var prof = "" + this.profitString();
            var colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
            profit = "Profit: " + colored;
        }
        console.log(enter + " - " + exit + " - " + profit);
    };
    // profit() {
    //   const fee = 0.0025;
    //   const entrance = this.enter.price * (1 + fee);
    //   if (this.exit) {
    //     const exit = this.exit.price * (1 - fee);
    //     return exit - entrance;
    //   } else {
    //     return 0;
    //   }
    // }
    Position.prototype.profitString = function () {
        return this.profit().toFixed(2);
    };
    return Position;
}(EventEmitter));
exports.Position = Position;
