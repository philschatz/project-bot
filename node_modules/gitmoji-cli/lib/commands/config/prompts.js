"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EMOJI_COMMIT_FORMATS = exports.CONFIGURATION_PROMPT_NAMES = void 0;

var _configurationVault = _interopRequireDefault(require("../../utils/configurationVault"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CONFIGURATION_PROMPT_NAMES = {
  AUTO_ADD: 'autoAdd',
  EMOJI_FORMAT: 'emojiFormat',
  SCOPE_PROMPT: 'scopePrompt',
  SIGNED_COMMIT: 'signedCommit'
};
exports.CONFIGURATION_PROMPT_NAMES = CONFIGURATION_PROMPT_NAMES;
const EMOJI_COMMIT_FORMATS = {
  CODE: 'code',
  EMOJI: 'emoji'
};
exports.EMOJI_COMMIT_FORMATS = EMOJI_COMMIT_FORMATS;

var _default = () => [{
  name: CONFIGURATION_PROMPT_NAMES.AUTO_ADD,
  message: 'Enable automatic "git add ."',
  type: 'confirm',
  default: _configurationVault.default.getAutoAdd()
}, {
  name: CONFIGURATION_PROMPT_NAMES.EMOJI_FORMAT,
  message: 'Select how emojis should be used in commits',
  type: 'list',
  choices: [{
    name: ':smile:',
    value: EMOJI_COMMIT_FORMATS.CODE
  }, {
    name: '😄',
    value: EMOJI_COMMIT_FORMATS.EMOJI
  }],
  default: _configurationVault.default.getEmojiFormat()
}, {
  name: CONFIGURATION_PROMPT_NAMES.SIGNED_COMMIT,
  message: 'Enable signed commits',
  type: 'confirm',
  default: _configurationVault.default.getSignedCommit()
}, {
  name: CONFIGURATION_PROMPT_NAMES.SCOPE_PROMPT,
  message: 'Enable scope prompt',
  type: 'confirm',
  default: _configurationVault.default.getScopePrompt()
}];

exports.default = _default;