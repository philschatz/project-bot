#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.options = void 0;

var _meow = _interopRequireDefault(require("meow"));

var _updateNotifier = _interopRequireDefault(require("update-notifier"));

var _package = _interopRequireDefault(require("../package.json"));

var _commands = _interopRequireDefault(require("./commands"));

var _findGitmojiCommand = _interopRequireDefault(require("./utils/findGitmojiCommand"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _updateNotifier.default)({
  pkg: _package.default
}).notify();
const cli = (0, _meow.default)(`
  Usage
    $ gitmoji
  Options
    --commit, -c    Interactively commit using the prompts
    --config, -g    Setup gitmoji-cli preferences.
    --init, -i      Initialize gitmoji as a commit hook
    --list, -l      List all the available gitmojis
    --remove, -r    Remove a previously initialized commit hook
    --search, -s    Search gitmojis
    --update, -u    Sync emoji list with the repo
    --version, -v   Print gitmoji-cli installed version
  Examples
    $ gitmoji -l
    $ gitmoji bug linter -s
`, {
  flags: {
    commit: {
      type: 'boolean',
      alias: 'c'
    },
    config: {
      type: 'boolean',
      alias: 'g'
    },
    help: {
      type: 'boolean',
      alias: 'h'
    },
    init: {
      type: 'boolean',
      alias: 'i'
    },
    list: {
      type: 'boolean',
      alias: 'l'
    },
    remove: {
      type: 'boolean',
      alias: 'r'
    },
    search: {
      type: 'boolean',
      alias: 's'
    },
    update: {
      type: 'boolean',
      alias: 'u'
    },
    version: {
      type: 'boolean',
      alias: 'v'
    }
  }
});
const options = {
  commit: () => _commands.default.commit('client'),
  config: () => _commands.default.config(),
  hook: () => _commands.default.commit('hook'),
  init: () => _commands.default.createHook(),
  list: () => _commands.default.list(),
  remove: () => _commands.default.removeHook(),
  search: () => cli.input.map(input => _commands.default.search(input)),
  update: () => _commands.default.update()
};
exports.options = options;
(0, _findGitmojiCommand.default)(cli, options);