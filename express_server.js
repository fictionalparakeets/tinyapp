const express = require("express");
const bodyParser = require("body-parser");
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
app.use(cookieSession({
  name: 'session',
  keys: ["tinySecret", "longSecret"]
}));


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


// Pages Render - Index
app.get("/", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);

  if (userObject) {
    return res.render('pages/index', { userObject });
  }

  // if user is not logged in: redirect to /login
  res.redirect('/login');
});


// Pages Render - URL Index (user's URL database)
app.get("/urls", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);

  if (userObject) {
    const usersURLs = getDatabaseObjectByUserID(userObject.id, urlDatabase);
    const templateVars = {
      urls: usersURLs,
      // user: userObject.email
      userObject
    };

    return res.render('pages/urls_index', templateVars);
  }

  // if user is not logged in: HTML error message instead of rendering login page
  res.status(403).send('You must be logged in to access this page.');
});


app.get("/urls/new", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);
  if (userObject) {
    return res.render('pages/urls_new', { userObject });
  }

  res.redirect('/login');
});


// Detail for each URL in the database
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
        userObject
      };

      return res.render('pages/urls_show', templateVars);
    }

    return res.status(403).send('URL does not exist in your account. Sorry');
  }


  // if user is not logged in returns HTML error message
  res.status(403).send('You must be logged in to access this page.');
});


app.get("/register", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);

  if (userEmail) {
    return res.status(418).send('You\'re already logged in!');
  }

  res.render('pages/registration', { userObject });
});

app.get("/login", (req, res) => {
  const userEmail = req.session.user_id;
  const userObject = getUserByEmail(userEmail, users);

  if (userEmail) {
    return res.status(418).send('You\'re already logged in!');
  }

  res.render('pages/login_page', { userObject });
});


// directs to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const databaseURLEntry = urlDatabase[req.params.shortURL];

  if (databaseURLEntry) {
    const longURL = databaseURLEntry.longURL;
    return res.redirect(longURL);
  }

  res.status(404).send('URL does not exist. Sorry');
});


// Posting new URL to user's account
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

  // if user is not logged in: HTML error message
  res.status(403).send('You must be logged in to access this page.');
});


// Deleting URLs from user's database
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


// update/modify a user's existing shortURL to a new longURL
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


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});


app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserByEmail(enteredEmail, users);
  const databasePassword = user.password;

  if (user) {
    const authenticated = userAuthenticated(enteredPassword, databasePassword);

    if (!enteredEmail || !enteredPassword) {
      return res.redirect('/login');
    }

    // set cookie if authenticated
    if (authenticated) {
      req.session.user_id = enteredEmail;
      return res.redirect('/urls');
    }

    // return an error message if email exists, but password is incorrect.
    return res.status(403).send('Error. Incorrect entry. Please try again.');
  }

  // error if email doesn't exist in database.
  res.status(403).send('Error. Can\'t find a user with that email.');
});


app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  const emailExists = doesEmailExist(enteredEmail, users);

  if (!enteredEmail || !enteredPassword) {
    return res.status(403).send('Error. Please input your email and choose a password.');
  }

  if (emailExists) {
    return res.status(403).send('Account already exists. Please login instead');
  }
  
  // user doesn't exist. create a new cookie and create a new user object in database.
  const userRandomID = generateRandomString();
  req.session.user_id = enteredEmail;
  users[userRandomID] = {
    id: userRandomID,
    email: enteredEmail,
    password: hashedPassword
  };

  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
