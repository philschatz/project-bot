"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _create = _interopRequireDefault(require("./create"));

var _remove = _interopRequireDefault(require("./remove"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  create: _create.default,
  remove: _remove.default
};
exports.default = _default;