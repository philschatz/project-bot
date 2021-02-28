"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Return a function that defaults to "info" level, and has properties for
// other levels:
//
//     app.log("info")
//     app.log.trace("verbose details");
//
exports.wrapLogger = function (logger, baseLogger) {
    var fn = Object.assign(logger.info.bind(logger), {
        // Add level methods on the logger
        debug: logger.debug.bind(logger),
        error: logger.error.bind(logger),
        fatal: logger.fatal.bind(logger),
        info: logger.info.bind(logger),
        trace: logger.trace.bind(logger),
        warn: logger.warn.bind(logger),
        // Expose `child` method for creating new wrapped loggers
        child: function (attrs) {
            // Bunyan doesn't allow you to overwrite name…
            var name = attrs.name;
            delete attrs.name;
            var log = logger.child(attrs, true);
            // …Sorry, bunyan, doing it anyway
            if (name) {
                log.fields.name = name;
            }
            return exports.wrapLogger(log, baseLogger || logger);
        },
        // Expose target logger
        target: baseLogger || logger
    });
    return fn;
};
//# sourceMappingURL=wrap-logger.js.map