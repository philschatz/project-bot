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

const createHook = async () => {
  const spinner = (0, _ora.default)('Creating the gitmoji commit hook').start();

  try {
    const {
      stdout
    } = await (0, _execa.default)('git', ['rev-parse', '--absolute-git-dir']);

    _fs.default.writeFile(stdout + _hook.default.PATH, _hook.default.CONTENTS, {
      mode: _hook.default.PERMISSIONS
    }, error => {
      if (error) return spinner.fail(error);
      spinner.succeed('Gitmoji commit hook created successfully');
    });
  } catch (error) {
    spinner.fail(`Error: ${error}`);
  }
};

var _default = createHook;
exports.default = _default;