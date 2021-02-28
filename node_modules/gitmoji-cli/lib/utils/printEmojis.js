"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const printEmojis = gitmojis => {
  return gitmojis.forEach(gitmoji => {
    console.log(`${gitmoji.emoji} - ${_chalk.default.blue(gitmoji.code)} - ${gitmoji.description}`);
  });
};

var _default = printEmojis;
exports.default = _default;