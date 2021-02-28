"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.config = void 0;

var _conf = _interopRequireDefault(require("conf"));

var _prompts = require("../commands/config/prompts");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const config = new _conf.default({
  projectName: 'gitmoji'
});
exports.config = config;

const setAutoAdd = autoAdd => {
  config.set(_prompts.CONFIGURATION_PROMPT_NAMES.AUTO_ADD, autoAdd);
};

const setEmojiFormat = emojiFormat => {
  config.set(_prompts.CONFIGURATION_PROMPT_NAMES.EMOJI_FORMAT, emojiFormat);
};

const setSignedCommit = signedCommit => {
  config.set(_prompts.CONFIGURATION_PROMPT_NAMES.SIGNED_COMMIT, signedCommit);
};

const setScopePrompt = scopePrompt => {
  config.set(_prompts.CONFIGURATION_PROMPT_NAMES.SCOPE_PROMPT, scopePrompt);
};

const getAutoAdd = () => {
  return config.get(_prompts.CONFIGURATION_PROMPT_NAMES.AUTO_ADD) || false;
};

const getEmojiFormat = () => {
  return config.get(_prompts.CONFIGURATION_PROMPT_NAMES.EMOJI_FORMAT) || _prompts.EMOJI_COMMIT_FORMATS.CODE;
};

const getSignedCommit = () => {
  return config.get(_prompts.CONFIGURATION_PROMPT_NAMES.SIGNED_COMMIT) || false;
};

const getScopePrompt = () => {
  return config.get(_prompts.CONFIGURATION_PROMPT_NAMES.SCOPE_PROMPT) || false;
};

var _default = {
  getAutoAdd,
  getEmojiFormat,
  getScopePrompt,
  getSignedCommit,
  setAutoAdd,
  setEmojiFormat,
  setScopePrompt,
  setSignedCommit
};
exports.default = _default;