"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _getEmojis = _interopRequireDefault(require("../../utils/getEmojis"));

var _printEmojis = _interopRequireDefault(require("../../utils/printEmojis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const update = () => (0, _getEmojis.default)(true).then(gitmojis => (0, _printEmojis.default)(gitmojis));

var _default = update;
exports.default = _default;