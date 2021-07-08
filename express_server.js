const {
  generateRandomString,
  getDatabaseObjectByUserID,
  getUserByEmail,
  userAuthenticated,
  doesEmailExist
} = require('./helpers');

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["tinySecret", "longSecret"]
}));

const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

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

// Middleware route for logged in versus strangers
// app.use('/', (req, res, next) => {
//   const userObject = getUserByEmail(req.session.user_id, users);
//   const approvedPaths = ['/', '/login', '/register'];
//   if (userObject || approvedPaths.includes(req.path)) {
//     return next;
//   }
//   res.redirect('/');
// });

// PAGES
// Pages Render - Index
app.get("/", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    return res.render('pages/index', { userObject });
  }
  // is this next line necessary?
  res.render('pages/index', { userObject });
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
  // res.cookie(error, "That's an error");
  res.redirect('/login');
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    return res.render('pages/urls_new', { userObject });
  }
  // res.cookie(error, "That's an error");
  res.redirect('/login');
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const shortURL = req.params.shortURL;
    const longURL = usersURLs[shortURL].longURL;
    const templateVars = {
      shortURL: shortURL,
      longURL: longURL,
      user: userObject.id
    };
    return res.render('pages/urls_show', templateVars);
  }
  // res.cookie(error, "That's an error");
  res.redirect('/login');
});

// Pages Render - Registration Page - on page 'registration.ejs'
app.get("/register", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  res.render('pages/registration', { userObject });
});

// Pages Render - Login Page - on page 'login_page.ejs'
app.get("/login", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  res.render('pages/login_page', { userObject });
});

// Method for directing to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// POSTS
// Method for posting new URL to 
app.post("/urls", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const generatedShort = generateRandomString();
    const receivedLongURL = req.body.longURL;
    urlDatabase[generatedShort] = {
      longURL: receivedLongURL,
      id: userObject.id
    }
    return res.redirect(`urls/${generatedShort}`);
  }
  // res.cookie(error, "That's an error");
  res.redirect('/login');
});

// Method for deleting URLs from urls_index.ejs
app.post("/urls/:shortURL/delete", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, users);
    const shortURLToDelete = req.params.shortURL;
    if (usersURLs[shortURLToDelete]) {
      delete urlDatabase[shortURLToDelete];
      return res.redirect('urls');
    }
  }
  res.status(403).send('URL requested for deletion not found in your account');
  // res.redirect('/login');
});

// Method for updating URLs from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const shortURLToEdit = req.params.id;
    if (usersURLs[shortURLToEdit]) {
      urlDatabase[shortURLToEdit].longURL = req.body.originalURL;
      return res.redirect('/urls');
    }
  }
  res.status(403).send('URL requested for edit not found in your account');
  // res.redirect('/login');
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
  const databasePassword = getUserByEmail(enteredEmail, users).password;
  const authenticated = userAuthenticated(enteredPassword, databasePassword);
  if (!enteredEmail || !enteredPassword) {
    // res.cookie(error, "That's an error");
    return res.status(403).send('Error. Please Try Again FIRST');
  }
  if (authenticated) {
    req.session.user_id = enteredEmail;
    return res.redirect('/urls')
  }
  // if not authenticated throw a 403 error
    // res.cookie(error, "That's an error");
  res.status(403).send('Error. Please Try Again SECOND');
  // res.redirect('/login');
});

// Method for registering - on page 'login_page.ejs'
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  // validate email and password entries. if not valid, redirect to registration page again
  if (!validateInputs(enteredEmail, enteredPassword)) {
    // res.cookie(error, "That's an error");
    return res.status(403).send('Error. Please Try Again');
  }

  // Test for user already existing, redirect to login
  if (doesEmailExist) {
    res.status(403).send('Account already exists');
    return res.redirect('/login');
  }

  // if user doesn't exist in the database, create a new cookie and create a new user object in database
  const userRandomID = generateRandomString();
  req.session.user_id = enteredEmail;
  users[userRandomID] = {
    id: userRandomID, 
    email: enteredEmail, 
    password: hashedPassword
  }
  res.redirect('/urls');
});
