"use strict";
exports.__esModule = true;
var Order = /** @class */ (function () {
    function Order(_a) {
        var price = _a.price, time = _a.time, size = _a.size;
        this.price = price;
        this.time = time;
        this.size = size;
    }
    Object.defineProperty(Order.prototype, "formatedTime", {
        get: function () {
            return this.time.toLocaleString();
        },
        enumerable: true,
        configurable: true
    });
    return Order;
}());
exports.Order = Order;
