"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const findGitmojiCommand = (cli, options) => {
  const flags = cli.flags;
  const matchedFlagsWithInput = Object.keys(flags).map(flag => flags[flag] && flag).filter(flag => options[flag]);
  return options[matchedFlagsWithInput] ? options[matchedFlagsWithInput]() : cli.showHelp();
};

var _default = findGitmojiCommand;
exports.default = _default;