"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const errors = {
  scope: _chalk.default.red('Enter a valid scope'),
  title: _chalk.default.red('Enter a valid commit title'),
  message: _chalk.default.red('Enter a valid commit message')
};

const title = title => !title || title.includes('`') ? errors.title : true;

const message = message => message.includes('`') ? errors.message : true;

const scope = scope => scope.includes('`') ? errors.scope : true;

var _default = {
  message,
  scope,
  title
};
exports.default = _default;