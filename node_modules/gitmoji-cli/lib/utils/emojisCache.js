"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CACHE_PATH = exports.GITMOJI_CACHE = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _pathExists = _interopRequireDefault(require("path-exists"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const GITMOJI_CACHE = {
  FOLDER: '.gitmoji',
  FILE: 'gitmojis.json'
};
exports.GITMOJI_CACHE = GITMOJI_CACHE;

const CACHE_PATH = _path.default.join(_os.default.homedir(), GITMOJI_CACHE.FOLDER, GITMOJI_CACHE.FILE);

exports.CACHE_PATH = CACHE_PATH;

const createEmojis = emojis => {
  if (!_pathExists.default.sync(_path.default.dirname(CACHE_PATH))) {
    _fs.default.mkdirSync(_path.default.dirname(CACHE_PATH));
  }

  _fs.default.writeFileSync(CACHE_PATH, JSON.stringify(emojis));
};

const getEmojis = () => {
  // $FlowFixMe
  return Promise.resolve(JSON.parse(_fs.default.readFileSync(CACHE_PATH)));
};

const isAvailable = () => _pathExists.default.sync(CACHE_PATH);

var _default = {
  createEmojis,
  getEmojis,
  isAvailable
};
exports.default = _default;