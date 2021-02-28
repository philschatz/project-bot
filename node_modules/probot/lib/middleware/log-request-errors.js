"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRequestErrors = function (err, req, res, next) {
    if (req.log) {
        req.log.error(err);
    }
    next();
};
//# sourceMappingURL=log-request-errors.js.map