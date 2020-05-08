"use strict";
exports.__esModule = true;
var Candlestick = /** @class */ (function () {
    function Candlestick(_a) {
        var low = _a.low, high = _a.high, close = _a.close, open = _a.open, 
        // interval,
        _b = _a.startTime, 
        // interval,
        startTime = _b === void 0 ? new Date() : _b, volume = _a.volume, _c = _a.price, price = _c === void 0 ? null : _c;
        this.startTime = startTime;
        // this.interval = interval;
        this.open = open || price;
        this.close = close || price;
        this.high = high || price;
        this.low = low || price;
        this.volume = volume || 1e-5;
        this.state = close ? "closed" : "open";
    }
    Candlestick.prototype.average = function () {
        return (this.close + this.high + this.low) / 3;
    };
    Candlestick.prototype.onPrice = function (_a) {
        var price = _a.price, volume = _a.volume, _b = _a.time, time = _b === void 0 ? new Date() : _b;
        if (this.state === "closed") {
            throw new Error("Trying to add to closed candlestick");
        }
        this.volume = this.volume + volume;
        if (this.high < price) {
            this.high = price;
        }
        if (this.low > price) {
            this.low = price;
        }
        this.close = price;
        var delta = (time - this.startTime) * 1e-3;
        if (delta >= this.interval) {
            this.state = "closed";
        }
    };
    return Candlestick;
}());
exports.Candlestick = Candlestick;
