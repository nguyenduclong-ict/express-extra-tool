const jwt = require('jsonwebtoken');
var JWT_SECRET, TOKEN_EXPIRES;

/**
 * Init config for jwt
 * @param {*} param0
 */
function initJWT({ secret, tokenExpires }) {
  JWT_SECRET = secret;
  TOKEN_EXPIRES = tokenExpires;
}

/**
 * Get Login info from token
 * @param {any} payload Data to sign
 */
function sign(payload) {
  try {
    let options = { expiresIn: TOKEN_EXPIRES };
    if (typeof payload === 'string') {
      options = {};
    }
    return {
      token: jwt.sign(payload, JWT_SECRET, options),
      token_expires_in: TOKEN_EXPIRES
    };
  } catch (error) {
    _log(error);
    throw Error.createError(error.message, error.code || 500);
  }
}

/**
 *
 * @param  {string} token Token of user
 */
function verify(token) {
  try {
    return {
      ...jwt.verify(token, JWT_SECRET),
      expiresIn: TOKEN_EXPIRES
    };
  } catch (error) {
    _log(error);
    if (error.name === 'TokenExpiredError') {
      throw Error.createError('Token hết hạn, vui lòng đăng nhập lại', 401);
    } else {
      throw Error.createError(error.message, error.code || 500);
    }
  }
}

module.exports = { instance: jwt, sign, verify, initJWT };
