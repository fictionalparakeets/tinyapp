const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  generateRandomString,
  getDatabaseObjectByUserID,
  getUserByEmail,
  userAuthenticated,
  doesEmailExist
} = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080
const salt = bcrypt.genSaltSync(10);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["tinySecret", "longSecret"]
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    id: "HISFEA"
  },
  "sgq3y6": {
    longURL: "http://www.google.com",
    id: "HISFEA"
  },
  "H2xV4w": {
    longURL: "http://www.lighthouselabs.ca",
    id: "A5674F"
  },
  "w4xV2H": {
    longURL: "http://www.google.ca",
    id: "A5674F"
  }
};

const users = {
  "HISFEA": {
    id: "HISFEA",
    email: "user@example.com",
    password: bcrypt.hashSync("1234", salt)
  },
  "A5674F": {
    id: "A5674F",
    email: "user2@example.com",
    password: bcrypt.hashSync("1234", salt)
  }
};

// PAGES
// Pages Render - Index
app.get("/", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    return res.render('pages/index', { userObject });
  }
  // if user is not logged in: redirect to /login
  res.render('pages/login_page', { userObject });
});

// Pages Render - URL Index (full database)
app.get("/urls", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const templateVars = {
      urls: usersURLs,
      user: userObject.email
    };
    return res.render('pages/urls_index', templateVars);
  }
  // if user is not logged in: returns HTML with a relevant error message instead of rendering login page
  res.status(403).send('You must be logged in to access this page.');
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const templateVars = { user: userObject.email };
    return res.render('pages/urls_new', templateVars);
  }
  res.render('pages/login_page', { userObject });
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const shortURL = req.params.shortURL;
    // check if url belongs to user
    if (usersURLs[shortURL]) {
      const longURL = usersURLs[shortURL].longURL;
      const templateVars = {
        shortURL: shortURL,
        longURL: longURL,
        user: userObject.email
      };
      return res.render('pages/urls_show', templateVars);
    }
    return res.status(403).send('URL does not exist in your account. Sorry');
  }
  // if user is not logged in: returns HTML with a relevant error message
  res.status(403).send('You must be logged in to access this page.');
});

// Pages Render - Registration - on page 'registration.ejs'
app.get("/register", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userEmail) {
    return res.status(418).send('You\'re already logged in!');
  }
  res.render('pages/registration', { userObject });
});

// Pages Render - Login - on page 'login_page.ejs'
app.get("/login", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userEmail) {
    return res.status(418).send('You\'re already logged in!');
  }
  res.render('pages/login_page', { userObject });
});

// Method for directing to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const databaseURLEntry = urlDatabase[req.params.shortURL];
  if (databaseURLEntry) {
    const longURL = databaseURLEntry.longURL;
    return res.redirect(longURL);
  }
  res.status(404).send('URL does not exist. Sorry');
});

// POSTS
// Method for posting new URL to user's account
app.post("/urls", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const generatedShort = generateRandomString();
    const receivedLongURL = req.body.longURL;
    urlDatabase[generatedShort] = {
      longURL: receivedLongURL,
      id: userObject.id
    };
    return res.redirect(`urls/${generatedShort}`);
  }
  // if user is not logged in: returns HTML with a relevant error message instead of redirecting to login page
  res.status(403).send('You must be logged in to access this page.');
});

// Method for deleting URLs from urls_index.ejs
app.post("/urls/:shortURL/delete", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const shortURLToDelete = req.params.shortURL;
    // check to make sure user owns the url to delete
    if (usersURLs[shortURLToDelete]) {
      delete urlDatabase[shortURLToDelete];
      return res.redirect('/urls');
    }
  }
  res.status(404).send('URL requested for deletion not found in your account');
});

// Method for updating URLs from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const shortURLToEdit = req.params.id;
    // check to make sure user owns the url to edit
    if (usersURLs[shortURLToEdit]) {
      urlDatabase[shortURLToEdit].longURL = req.body.originalURL;
      return res.redirect('/urls');
    }
  }
  res.status(404).send('URL requested for edit not found in your account');
});

// Method for logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// Method for logging in (receiving email and password from text input fields in _header.ejs)
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserByEmail(enteredEmail, users);
  const databasePassword = user.password;
  if (user) {
    const authenticated = userAuthenticated(enteredPassword, databasePassword);
    // validate inputs
    if (!enteredEmail || !enteredPassword) {
      return res.redirect('/login');
    }
    // you're authenticated. you get a cookie!
    if (authenticated) {
      req.session.user_id = enteredEmail;
      return res.redirect('/urls');
    }
  }
  res.status(403).send('Error. Please try logging in again.');
});

// Method for registering - on page 'login_page.ejs'
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  // validate inputs
  if (!enteredEmail || !enteredPassword) {
    return res.status(403).send('Error. Please Try Again');
  }
  // check for existing email in database
  if (doesEmailExist(enteredEmail)) {
    return res.status(403).send('Account already exists. Please login instead');
  }
  // user doesn't exist. create a new cookie and create a new user object in database
  const userRandomID = generateRandomString();
  req.session.user_id = enteredEmail;
  users[userRandomID] = {
    id: userRandomID,
    email: enteredEmail,
    password: hashedPassword
  };
  res.redirect('/urls');
});
