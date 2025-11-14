if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const cors = require('cors');
const userController = require('./controllers/userController');
const bookController = require('./controllers/bookController');
const errorHandler = require('./middlewares/errorHandler');
const authentication = require('./middlewares/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== PUBLIC ROUTES - No authentication required =====

// User authentication routes
app.post('/register', userController.register);
app.post('/login', userController.login);
// app.post('/auth/google', userController.googleOAuthLogin);

// Public book browsing routes
app.get('/', bookController.list);
app.get('/book/:id', bookController.detail);

// ===== PROTECTED ROUTES - Authentication required =====

// User routes
app.post('/logout', authentication, userController.logout);

// Book interaction routes
app.post('/book/:id/like', authentication, bookController.like);
app.get('/user/:username/bookshelf', authentication, userController.getUserBookshelf)
app.get('/user/:id', authentication, userController.readUser)

// Error handler must be last
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = app;