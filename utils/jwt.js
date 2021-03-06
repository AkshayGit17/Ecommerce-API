const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  return token;
};

const attachCookiesToResponse = ({ res, tokenUser }) => {
  const token = createJWT({ payload: tokenUser });

  const oneDay = 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    expires: new Date(Date.now() + oneDay),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
  });
};

const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { createJWT, isTokenValid, attachCookiesToResponse };
