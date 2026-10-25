const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customerRoutes = require('./router/auth_users.js').authenticated;
const generalRoutes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use(
  '/customer',
  session({
    secret: 'fingerprint_customer',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  }),
);

app.use('/customer/auth/*', (req, res, next) => {
  const authorization = req.session.authorization;

  if (!authorization?.accessToken) {
    return res.status(403).json({ message: 'User not logged in' });
  }

  return jwt.verify(authorization.accessToken, 'access', (error, user) => {
    if (error) {
      return res.status(403).json({ message: 'User not authenticated' });
    }

    req.user = user;
    return next();
  });
});

app.use('/customer', customerRoutes);
app.use('/', generalRoutes);

const PORT = Number(process.env.PORT) || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
