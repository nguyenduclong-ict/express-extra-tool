const fs = require('fs');
const path = require('path');

/**
 * Create URL with query parammeter
 * @param {string} url url
 * @param {object} parameters query parameters
 */

function makeURL(url, parameters) {
  const query = Object.entries(parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  if (query) {
    return url + '?' + query;
  } else {
    return url + query;
  }
}

/**
 * Defined Log function
 */
Object.defineProperty(global, '__stack', {
  get: function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
      return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function() {
    return __stack[1].getLineNumber();
  }
});

const ConsoleColors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',

  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',

  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
};

/**
 * Same console.log and add current line to output
 * @param  {...any,number} args something to log
 */

function log() {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  const callee = err.stack[0];
  Error.prepareStackTrace = orig;
  const f = path.relative(process.cwd(), callee.getFileName());
  const line = callee.getLineNumber();

  const prefix = [`---${f}:`, line, '\n'];
  const sufix = [];
  let color;
  switch (arguments[arguments.length - 1]) {
    case '%error%':
      color = ConsoleColors.FgRed;
      break;
    case '%success%':
      color = ConsoleColors.FgGreen;
      break;
    case '%warning%':
      color = ConsoleColors.FgYellow;
      break;
    default:
      break;
  }
  if (color) {
    prefix.unshift(color);
    prefix.push(color);
    sufix.push(ConsoleColors.Reset);
    arguments[arguments.length - 1] = '';
  }
  console.log(...prefix, ...arguments, ...sufix);
}

/**
 * Import middleware from dirroot
 * @param {string} name name of middleware
 * @returns {object} object require
 */
function md(name) {
  return require(path.join(__dirroot, 'middleware', name));
}

/**
 * Require file with start point is __diroot
 * @param {*} p path to folder
 * @returns {object} object require
 */
function rq(p) {
  return require(path.join(__dirroot, p));
}

/**
 * remove fields in object
 * @param {object} obj object source
 * @param {[string]} fields properties want remove
 * @returns {object} The object after deleting fields
 */
function clean(obj, fields = []) {
  if (typeof fields === 'string') fields = fields.split(',');
  if (!Array.isArray(fields)) {
    return obj;
  } else {
    return Object.fromEntries(
      Object.entries(obj).filter(item => !fields.includes(item[0]))
    );
  }
}

/**
 * Remove all properties includes by 'omitValue'
 * @param {object} obj Object source
 * @param {array} omitValue Array of value you want delete
 * @returns {object} Object after remove value
 */
function omit(obj = {}, omitValue = [null, undefined]) {
  this.Object.keys(obj).forEach(key => {
    if (omitValue.includes(obj[key])) delete obj[key];
  });
  if (Array.isArray(obj)) return obj.filter(e => !!e);
  return obj;
}

// Regex function for search functionality
function escapeRegex(string = '') {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Validate query object, all properties in optionsKey will return to options in result
 * @param {*} query Object
 * @returns {{query, options}} {query, options}
 */
function validateQuery(query, optionsKey = ['$page', '$limit', '$populate']) {
  query = omit(query);
  const q = {};
  const opts = {};
  Object.keys(query).forEach(key => {
    if (optionsKey.includes(key)) {
      if (key === '$populate' && typeof query[key] === 'string') {
        query[key] = query[key].split(',');
      }
      opts[key.replace('$', '')] = query[key];
    } else {
      q[key] = query[key];
    }
  });
  return {
    query: q,
    options: opts
  };
}

/**
 * Import all file and subfile in folder
 * @param {string} dirPath  path of directory for import
 * @param {RegExp} execpt  except file name
 * @returns {array} Array of file imported
 */

function importAll(dirPath, execpt) {
  let items = [];
  let files = fs
    .readdirSync(dirPath)
    .map(f => path.parse(f))
    .filter(f => {
      return (
        (execpt ? !new RegExp(execpt).test(f.name) : true) &&
        (!f.ext || f.ext === '.js')
      ); // Acept file .js
    });

  files.forEach(file => {
    if (!file.ext) {
      let subFiles = importAll(`${dirPath}/${file.name}`, execpt).map(f => ({
        ...f,
        name: file.name + (f.name !== 'index' ? `/${f.name}` : '')
      }));

      // push files to items
      items = [...items, ...subFiles];
    } else {
      const item = {
        name: file.name === 'index' ? '' : file.name,
        instance: require(`${dirPath}/${file.name}`)
      };
      items.push(item);
    }
  });
  return items;
}

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  err.status = code;
  return err;
}

/**
 * Debounce function for special key, if different key, 2 func run parallel
 * @param {Function} func (...args, key)
 * @param {Number} wait miliseconds
 */

function debounceKey(func, wait) {
  var timeouts = {};
  return function() {
    var context = this;
    var args = arguments;
    var key = arguments[arguments.length - 1];
    if (timeouts[key]) clearTimeout(timeouts[key]);
    var later = function() {
      timeouts[key] = null;
      func.apply(context, args);
    };
    timeouts[key] = setTimeout(later, wait);
  };
}

/**
 * Make query string from object
 * @param {object} params
 */

function buildQuery(params, separator = '&') {
  function lean(value) {
    const arr = [undefined, null];
    return arr.includes(value) ? '' : value;
  }
  return Object.entries(params)
    .map(p => `${p[0]}=${lean(p[1])}`)
    .join(separator);
}

/**
 * parse query string to object
 * @param {string} queryString
 */
function parseQuery(queryString, separator = '&') {
  const obj = {};
  queryString.split(separator).forEach(item => {
    let [key, value] = item.split('=');
    obj[key] = obj[key] ? [...obj[key], value] : value;
  });
  return obj;
}

module.exports = {
  parseQuery,
  buildQuery,
  makeURL,
  log,
  omit,
  md,
  rq,
  clean,
  escapeRegex,
  validateQuery,
  importAll,
  createError,
  debounceKey
};
