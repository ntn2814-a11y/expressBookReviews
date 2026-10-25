const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const publicUsers = express.Router();
const PORT = Number(process.env.PORT) || 5000;
const BASE_URL = process.env.BOOKS_API_URL || `http://127.0.0.1:${PORT}`;

const getAllBooks = () => Promise.resolve(books);

const findBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject({ status: 404, message: `Book not found for ISBN ${isbn}` });
    }
  });

const findBooksByField = (field, value) =>
  new Promise((resolve, reject) => {
    const query = value.toLowerCase();
    const matches = Object.entries(books).reduce((result, [isbn, book]) => {
      if (book[field].toLowerCase() === query) {
        result[isbn] = book;
      }
      return result;
    }, {});

    if (Object.keys(matches).length > 0) {
      resolve(matches);
    } else {
      reject({ status: 404, message: `No books found with ${field} ${value}` });
    }
  });

const sendError = (res, error, fallbackMessage) => {
  const status = error.status || error.response?.status || 500;
  const data = error.response?.data || {
    message: error.message || fallbackMessage,
  };
  return res.status(status).json(data);
};

// Register a new user.
publicUsers.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: 'User already exists' });
  }

  users.push({ username, password });
  return res
    .status(201)
    .json({ message: 'User successfully registered. Now you can login' });
});

// Task 1 / Task 10: Retrieve all books with async/await and a Promise helper.
publicUsers.get('/', async (req, res) => {
  try {
    const allBooks = await getAllBooks();
    return res.status(200).json(allBooks);
  } catch (error) {
    return sendError(res, error, 'Error fetching book list');
  }
});

// Task 2 / Task 11: Retrieve a book by ISBN using Promise callbacks.
publicUsers.get('/isbn/:isbn', (req, res) =>
  findBookByISBN(req.params.isbn)
    .then((book) => res.status(200).json(book))
    .catch((error) => sendError(res, error, 'Error fetching book by ISBN')),
);

// Task 3 / Task 12: Retrieve books by author using async/await.
publicUsers.get('/author/:author', async (req, res) => {
  try {
    const matches = await findBooksByField('author', req.params.author);
    return res.status(200).json(matches);
  } catch (error) {
    return sendError(res, error, 'Error fetching books by author');
  }
});

// Task 4 / Task 13: Retrieve books by title using Promise callbacks.
publicUsers.get('/title/:title', (req, res) =>
  findBooksByField('title', req.params.title)
    .then((matches) => res.status(200).json(matches))
    .catch((error) => sendError(res, error, 'Error fetching books by title')),
);

// Task 5: Retrieve the reviews for one book.
publicUsers.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res
      .status(404)
      .json({ message: `Book not found for ISBN ${req.params.isbn}` });
  }

  if (Object.keys(book.reviews).length === 0) {
    return res.status(200).json({ message: 'No reviews found for this book.' });
  }

  return res.status(200).json(book.reviews);
});

// Tasks 10-13: reusable Axios implementations.
const getAllBooksAxios = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

const getBookByISBNAxios = (isbn) =>
  axios
    .get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data);

const getBooksByAuthorAxios = async (author) => {
  const response = await axios.get(
    `${BASE_URL}/author/${encodeURIComponent(author)}`,
  );
  return response.data;
};

const getBooksByTitleAxios = (title) =>
  axios
    .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data);

publicUsers.get('/async/books', async (req, res) => {
  try {
    return res.status(200).json(await getAllBooksAxios());
  } catch (error) {
    return sendError(res, error, 'Error fetching book list with Axios');
  }
});

publicUsers.get('/async/isbn/:isbn', (req, res) =>
  getBookByISBNAxios(req.params.isbn)
    .then((book) => res.status(200).json(book))
    .catch((error) => sendError(res, error, 'Error fetching ISBN with Axios')),
);

publicUsers.get('/async/author/:author', async (req, res) => {
  try {
    return res.status(200).json(
      await getBooksByAuthorAxios(req.params.author),
    );
  } catch (error) {
    return sendError(res, error, 'Error fetching author with Axios');
  }
});

publicUsers.get('/async/title/:title', (req, res) =>
  getBooksByTitleAxios(req.params.title)
    .then((matches) => res.status(200).json(matches))
    .catch((error) => sendError(res, error, 'Error fetching title with Axios')),
);

module.exports.general = publicUsers;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
