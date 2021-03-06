'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DtsCreator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _isThere = require('is-there');

var _isThere2 = _interopRequireDefault(_isThere);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _camelcase = require('camelcase');

var _camelcase2 = _interopRequireDefault(_camelcase);

var _tokenValidator = require('./tokenValidator');

var _fileSystemLoader = require('./fileSystemLoader');

var _fileSystemLoader2 = _interopRequireDefault(_fileSystemLoader);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var validator = new _tokenValidator.TokenValidator();

var DtsContent = function () {
  function DtsContent(_ref) {
    var rootDir = _ref.rootDir,
        searchDir = _ref.searchDir,
        outDir = _ref.outDir,
        rInputPath = _ref.rInputPath,
        rawTokenList = _ref.rawTokenList,
        resultList = _ref.resultList,
        messageList = _ref.messageList;

    _classCallCheck(this, DtsContent);

    this.rootDir = rootDir;
    this.searchDir = searchDir;
    this.outDir = outDir;
    this.rInputPath = rInputPath;
    this.rawTokenList = rawTokenList;
    this.resultList = resultList;
    this.messageList = messageList;
  }

  _createClass(DtsContent, [{
    key: 'writeFile',
    value: function writeFile() {
      var _this = this;

      var outPathDir = _path2.default.dirname(this.outputFilePath);
      if (!(0, _isThere2.default)(outPathDir)) {
        _mkdirp2.default.sync(outPathDir);
      }
      return new Promise(function (resolve, reject) {
        _fs2.default.writeFile(_this.outputFilePath, _this.formatted + _os2.default.EOL, 'utf8', function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(_this);
          }
        });
      });
    }
  }, {
    key: 'contents',
    get: function get() {
      return this.resultList;
    }
  }, {
    key: 'formatted',
    get: function get() {
      if (!this.resultList || !this.resultList.length) return 'export default {};';
      return this.resultList.join(_os2.default.EOL);
    }
  }, {
    key: 'tokens',
    get: function get() {
      return this.rawTokenList;
    }
  }, {
    key: 'outputFilePath',
    get: function get() {
      return _path2.default.join(this.rootDir, this.outDir, this.rInputPath + '.d.ts');
    }
  }, {
    key: 'inputFilePath',
    get: function get() {
      return _path2.default.join(this.rootDir, this.searchDir, this.rInputPath);
    }
  }]);

  return DtsContent;
}();

var DtsCreator = exports.DtsCreator = function () {
  function DtsCreator(options) {
    _classCallCheck(this, DtsCreator);

    if (!options) options = {};
    this.rootDir = options.rootDir || _process2.default.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.loader = new _fileSystemLoader2.default(this.rootDir);
    this.inputDirectory = _path2.default.join(this.rootDir, this.searchDir);
    this.outputDirectory = _path2.default.join(this.rootDir, this.outDir);
    this.camelCase = !!options.camelCase;
  }

  _createClass(DtsCreator, [{
    key: 'create',
    value: function create(filePath, initialContents) {
      var _this2 = this;

      var clearCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return new Promise(function (resolve, reject) {
        var rInputPath;
        if (_path2.default.isAbsolute(filePath)) {
          rInputPath = _path2.default.relative(_this2.inputDirectory, filePath);
        } else {
          rInputPath = _path2.default.relative(_this2.inputDirectory, _path2.default.join(_process2.default.cwd(), filePath));
        }
        if (clearCache) {
          _this2.loader.tokensByFile = {};
        }
        _this2.loader.fetch(filePath, "/", undefined, initialContents).then(function (res) {
          if (res) {
            var tokens = res;
            var keys = Object.keys(tokens);
            var validKeys = [],
                invalidKeys = [];
            var messageList = [];

            keys.forEach(function (key) {
              var convertedKey = _this2.camelCase ? (0, _camelcase2.default)(key) : key;
              var ret = validator.validate(convertedKey);
              if (ret.isValid) {
                validKeys.push(convertedKey);
              } else {
                messageList.push(ret.message);
              }
            });

            var result = validKeys.map(function (k) {
              return 'export const ' + k + ': string;';
            });

            var content = new DtsContent({
              rootDir: _this2.rootDir,
              searchDir: _this2.searchDir,
              outDir: _this2.outDir,
              rInputPath: rInputPath,
              rawTokenList: keys,
              resultList: result,
              messageList: messageList
            });

            resolve(content);
          } else {
            reject(res);
          }
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }]);

  return DtsCreator;
}();