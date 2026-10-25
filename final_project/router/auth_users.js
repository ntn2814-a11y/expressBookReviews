const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');

const regdUsers = express.Router();
const users = [];

const isValid = (username) =>
  users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some(
    (user) => user.username === username && user.password === password,
  );

// Only registered users can log in.
regdUsers.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  if (!authenticatedUser(username, password)) {
    return res
      .status(401)
      .json({ message: 'Invalid login. Check username and password' });
  }

  const accessToken = jwt.sign(
    { username, data: username },
    'access',
    { expiresIn: '1h' },
  );

  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: 'User successfully logged in' });
});

// Add or modify the logged-in user's review.
regdUsers.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const review = req.query.review ?? req.body.review;
  const username = req.session.authorization.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book not found for ISBN ${isbn}` });
  }

  if (!review) {
    return res.status(400).json({ message: 'Review text is required' });
  }

  book.reviews[username] = review;
  return res.status(200).json({
    message: `Review for ISBN ${isbn} has been added/updated`,
    reviews: book.reviews,
  });
});

// Delete only the logged-in user's review.
regdUsers.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.session.authorization.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book not found for ISBN ${isbn}` });
  }

  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res
      .status(404)
      .json({ message: `No review by this user found for ISBN ${isbn}` });
  }

  delete book.reviews[username];
  return res.status(200).json({
    message: `Review for ISBN ${isbn} has been deleted`,
    reviews: book.reviews,
  });
});

module.exports.authenticated = regdUsers;
module.exports.authenticatedUser = authenticatedUser;
module.exports.isValid = isValid;
module.exports.users = users;
