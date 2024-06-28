// sessionConfig.js
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db.js'); // Adjust the path as needed
const sessionStore = new MySQLStore({
    expiration: 60 * 60 * 1000, // 5 minutes (session timeout)
    schema: {
        tableName: 'sessions'
    },
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 60000, // 1 minute (check expired sessions every minute)
    connectionLimit: 1,
    endConnectionOnClose: true
}, pool);
const sessionMiddleware = session({
    secret: 'your_secret_here', // Replace with a secret key for session encryption
    resave: false,
    saveUninitialized: false,
    store: sessionStore
});
function isAuthenticated(req, res, next) {
    if (req.session.user) {
      return next();
    }
    res.redirect('/');
}
// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
      return next();
  } else {
      return res.status(403).json({ error: 'Access denied' });
  }
}
// Middleware to check if user is supervisor
function isSupervisor(req, res, next) {
  if (req.session.user && req.session.user.role === 'supervisor') {
      return next();
  } else {
      return res.status(403).json({ error: 'Access denied' });
  }
}
// Middleware to check if user is a regular user
function isUser(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') {
      return next();
  } else {
      return res.status(403).json({ error: 'Access denied' });
  }
}
module.exports = { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser };
