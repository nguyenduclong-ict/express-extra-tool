const functions = require('./src/ex-global');
const { initRouter } = require('./src/router');
const { connectDatabase, declareHook, declareCRUD } = require('./src/mongoose');
const jwt = require('./src/jwt');
/**
 * Import all in ex-global to global variable
 * @param {{ names : [string], dirroot : string, additions : [{name : string, value : any }]}} param0 Name of function you want import to global
 */
function initGlobal({ names, dirroot, additions }) {
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
  additions.forEach(({ name, value }) => {
    global[name] = value;
  });
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
