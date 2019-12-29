'use strict';

const functions = require('./src/ex-global');
const { initRouter } = require('./src/router');
const { connectDatabase, declareHook, declareCRUD } = require('./src/mongoose');
const jwt = require('./src/jwt');
/**
 * Import all in ex-global to global variable
 * @param {[string]} names Name of function you want import to global
 */
function initGlobal(names, dirroot) {
  global.__dirroot = dirroot;
  if (!names) {
    Object.keys(functions).forEach(key => {
      global['_' + key] = functions[key];
    });
  } else {
    Object.keys(functions)
      .filter(key => names.includes(key))
      .forEach(key => {
        global['_' + key] = functions[key];
      });
  }
}

module.exports = {
  initGlobal,
  initRouter,
  functions,
  mongoose: {
    connectDatabase,
    declareHook,
    declareCRUD
  },
  jwt
};
