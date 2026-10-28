const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a JWT token with user id and role
 */
function signToken(user) {
  const payload = {
    id: user._id || user.id,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = {
  signToken,
  verifyToken,
};
