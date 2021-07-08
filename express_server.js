const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());




let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "HISFEA": {
    id: "HISFEA", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "A5674F": {
    id: "A5674F", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
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


const getUserObjectByEmail = function(enteredEmail) {
  for (const userInDatabase in users) {
    if (enteredEmail === users[userInDatabase].email) {
      console.log('email match found in database');
      return users[userInDatabase];
    }
  }
  return false;
}

// return the existing user object in users, based on cookie's 'user_id'
// Should this exist?
const getUserObjectByCookie = function(cookieID) {
  for (const userInDatabase in users) {
    if (cookieID === users[userInDatabase]) {
      return users[userInDatabase];
    }
  }
};

const userAuthenticated = function(enteredEmail, enteredPassword) {
  let userObject = getUserObjectByEmail(enteredEmail);
  if (userObject) {
    if (enteredPassword === userObject.password) {
      console.log("password match for entered email");
      return userObject;
    }
  }
  return false;
};



// PAGES
// Pages Render - Index
app.get("/", (req, res) => {
  const user = users[req.cookies.user_id];
  res.render('pages/index', { user });
});

// Pages Render - URL Index (full database)
app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.render('pages/login_page', { user });
  }
  const templateVars = { 
    urls: urlDatabase,
    user: user
  };
  res.render('pages/urls_index', templateVars);  
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.render('pages/login_page', { user });
  }
  res.render('pages/urls_new', { user });
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: user
  };
  res.render('pages/urls_show', templateVars);
});

// Pages Render - Registration Page - on page 'registration.ejs'
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  res.render('pages/registration', { user });
});

// Pages Render - Login Page - on page 'login_page.ejs'
app.get("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  res.render('pages/login_page', { user });
});

// Method for directing to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// POSTS
// Method for posting new URL to urlDatabase
app.post("/urls", (req, res) => {
  const generatedShort = generateRandomString();
  const receivedLongURL = req.body.longURL;
  urlDatabase[generatedShort] = receivedLongURL;
  res.redirect(`urls/${generatedShort}`);
});

// Method for deleting URLs from urls_index.ejs
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURLToDelete = req.params.shortURL;
  delete urlDatabase[shortURLToDelete];
  res.redirect('urls');
});

// Method for updating URLs from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.originalURL;
  res.redirect('/urls');
});

// Method for logging out
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

// Break out the entry validation to a separate function, call it in the login and register methods
const validateInput = function(enteredEmail, enteredPassword) {
  //
}


// Method for logging in (receiving email and password from text input fields in _header.ejs)
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  let userObject = userAuthenticated(enteredEmail, enteredPassword);
  if (userObject) {
    res.cookie("user_id", userObject.id);
    return res.redirect('/urls')
  }
  // if not authenticated throw a 403 error
  return res.status(403).send('Error. Please Try Again');
});

// New Method for registering - on page 'login_page.ejs'
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  // validate email and password entries. if not valid, redirect to registration page again
  if (!enteredEmail || !enteredPassword) {
    console.log('something is entered incorrectly');
    // TO DO: pass an object for registration page html to render and incorrect entry
    return res.status(403).send('Error. Please Try Again');
  }
  
  // Authenticate User:
  const userObjectByEmail = getUserObjectByEmail(enteredEmail);
  const userID = userObjectByEmail.id;

  if (userObjectByEmail) {
    if (userObjectByEmail.password === enteredPassword) {
      console.log('password matches email');
      // set cookies with existing userID
      res.cookie("user_id", userID);
      console.log('set cookie with this userID: ', userID);
      // return and redirect to /urls
      return res.redirect('/urls')     
    }
    // CHANGE THIS TO NOT SPECIFY EMAIL
    res.status(403).send('Account already exists');
    return res.redirect('/login');
  }
  // End Authenticate User


  // if user doesn't exist in the database, create a new cookie and create a new user object in database
    // new cookie:
  const userRandomID = generateRandomString();
  res.cookie("user_id", userRandomID);
    // create a database entry
  let userObjectFromDatabase = {
    id: userRandomID, 
    email: enteredEmail, 
    password: enteredPassword
  }
    // add object to database
  users[userRandomID] = userObjectFromDatabase;
  console.log('no match in database, created a new user');
    // redirect to urls
  res.redirect('/urls');
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
