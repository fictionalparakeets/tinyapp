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

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "HISFEA"
  },
  "sgq3y6": {
    longURL: "http://www.google.com",
    userID: "HISFEA"
  },
  "H2xV4w": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "A5674F"
  },
  "w4xV2H": {
    longURL: "http://www.google.ca",
    userID: "A5674F"
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

// Helper function to generate random strings for short URLs
function generateRandomString() {
  let string = '';
  while (string.length < 6) {
    const randomValue = Math.floor(Math.random() * 34) + 2;
    const randomValTo36 = Math.random().toString(randomValue).substr(2, 6);
    string += randomValTo36;
  }
  return string;
};

// Helper function to iterate over urls database and return each user's collection of urls
const getUserDatabaseByUser = function(sessionCookieEmail) {
  const usersURLs = {};
  const userID = getUserByEmail(sessionCookieEmail, users).id;
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      usersURLs[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return usersURLs;
};

// Helper functions for authenticating users
const getUserByEmail = function(enteredEmail, database) {
  for (const userInDatabase in database) {
    if (enteredEmail === users[userInDatabase].email) {
      return users[userInDatabase];
    }
  }
  return false;
}

// Validate email and password inputs
const validateInputs = function(enteredEmail, enteredPassword) {
  const truthy = (!enteredEmail || !enteredPassword) ? true : false;
  return truthy;
}

// Helper functions for authenticating users
const userAuthenticated = function(enteredEmail, enteredPassword) {
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  const passwordsMatch = bcrypt.compareSync(enteredPassword, hashedPassword);
  if (passwordsMatch) {
    // res.cookie(error) ? res.clearCookie(error) : null;
    return true;
  }
  return false;
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
  const user = req.session.user_id;
  if (user) {
    return res.render('pages/index', { user });
  }
  res.render('pages/index', { user: false });
});

// Pages Render - URL Index (full database)
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    const usersURLs = getUserDatabaseByUser(user);
    const templateVars = { 
      urls: usersURLs,
      user: user
    };
    return res.render('pages/urls_index', templateVars);  
  }
  // res.cookie(error, "That's an error");
  res.redirect('/');
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    return res.render('pages/urls_new', { user });
  }
  // res.cookie(error, "That's an error");
  res.redirect('/');
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    const usersURLs = getUserDatabaseByUser(user);
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: usersURLs[req.params.shortURL],
      user: user
    };
    return res.render('pages/urls_show', templateVars);
  }
  // res.cookie(error, "That's an error");
  res.redirect('/');
});

// Pages Render - Registration Page - on page 'registration.ejs'
app.get("/register", (req, res) => {
  const user = req.session.user_id;
  res.render('pages/registration', { user });
});

// Pages Render - Login Page - on page 'login_page.ejs'
app.get("/login", (req, res) => {
  const user = req.session.user_id;
  res.render('pages/login_page', { user });
});

// Method for directing to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// POSTS
// Method for posting new URL to 
app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    const generatedShort = generateRandomString();
    const receivedLongURL = req.body.longURL;
    urlDatabase[generatedShort] = {
      longURL: receivedLongURL,
      userID: generatedShort
    }
    return res.redirect(`urls/${generatedShort}`);
  }
  // res.cookie(error, "That's an error");
  res.redirect('/login');
});

// Method for deleting URLs from urls_index.ejs
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    const usersURLs = getUserDatabaseByUser(user.id);
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
  const user = req.session.user_id;
  if (user) {
    const usersURLs = getUserDatabaseByUser(user);
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
  let userObject = userAuthenticated(enteredEmail, enteredPassword);
  if (userObject) {
    req.session.user_id = enteredEmail;
    return res.redirect('/urls')
  }
  // if not authenticated throw a 403 error
    // res.cookie(error, "That's an error");
  return res.status(403).send('Error. Please Try Again');
  // res.redirect('/login');
});

// New Method for registering - on page 'login_page.ejs'
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  // validate email and password entries. if not valid, redirect to registration page again
  if (!validateInputs(enteredEmail, enteredPassword)) {
      // res.cookie(error, "That's an error");

    return res.status(403).send('Error. Please Try Again');
  }
  
  /* Test for user already existing?
  const userObject = getUserByEmail(enteredEmail, users);
  const userID = userObject.id;
  // Authenticate User:
  if (userObject) {
    if (passwordsMatch) {
      console.log('password matches email');
      // set cookies with existing userID
      res.cookie("user_id", userID);
      console.log('set cookie with this userID: ', userID);
      // return and redirect to /urls
      return res.redirect('/urls')     
    }
    // CHANGE THIS TO SET A COOKIE
    res.status(403).send('Account already exists');
    return res.redirect('/login');
  }
  // End Authenticate User
  */

  // if user doesn't exist in the database, create a new cookie and create a new user object in database
  const userRandomID = generateRandomString();
  // set session cookie for new user
  req.session.user_id = enteredEmail;
    // add object to database
  users[userRandomID] = {
    id: userRandomID, 
    email: enteredEmail, 
    password: hashedPassword
  }
  console.log('no match in database, created a new user');
  console.log(userToAdd);
    // redirect to urls
  res.redirect('/urls');
});
