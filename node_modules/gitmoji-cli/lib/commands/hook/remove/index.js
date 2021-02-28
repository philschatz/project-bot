"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _execa = _interopRequireDefault(require("execa"));

var _ora = _interopRequireDefault(require("ora"));

var _hook = _interopRequireDefault(require("../hook"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const removeHook = async () => {
  const spinner = (0, _ora.default)('Creating the gitmoji commit hook').start();

  try {
    const {
      stdout
    } = await (0, _execa.default)('git', ['rev-parse', '--absolute-git-dir']);

    _fs.default.unlink(stdout + _hook.default.PATH, error => {
      if (error) return spinner.fail('Error: Gitmoji commit hook is not created');
      spinner.succeed('Gitmoji commit hook removed successfully');
    });
  } catch (error) {
    spinner.fail(`Error: ${error}`);
  }
};

var _default = removeHook;
exports.default = _default;