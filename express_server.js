const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);



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
const getUserDatabaseByUser = function(userIDInput) {
  const usersURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userIDInput) {
      usersURLs[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return usersURLs;
};

// Helper functions for authenticating users
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
// const getUserObjectByCookie = function(cookieID) {
//   for (const userInDatabase in users) {
//     if (cookieID === users[userInDatabase]) {
//       return users[userInDatabase];
//     }
//   }
// };


// Validate email and password inputs
const validateInputs = function(enteredEmail, enteredPassword) {
  //
  if (!enteredEmail || !enteredPassword) {
    console.log('something is entered incorrectly');
    // TO DO: pass an object for registration page html to render and incorrect entry
    // CHANGE THIS TO A COOKIE
    return false;
    // return res.status(403).send('Error. Please Try Again');
  }
  return true
}


// Helper functions for authenticating users
const userAuthenticated = function(enteredEmail, enteredPassword) {
  const userObject = getUserObjectByEmail(enteredEmail);
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  const passwordsMatch = bcrypt.compareSync(enteredPassword, hashedPassword);
  if (userObject) {
    if (passwordsMatch) {
      console.log("password match for entered email");
      return true;
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
  const usersURLs = getUserDatabaseByUser(user.id);
  const templateVars = { 
    urls: usersURLs,
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
  const usersURLs = getUserDatabaseByUser(user.id);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: usersURLs[req.params.shortURL],
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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


// POSTS
// Method for posting new URL to 
app.post("/urls", (req, res) => {
  const generatedShort = generateRandomString();
  const receivedLongURL = req.body.longURL;
  urlDatabase[generatedShort] = {
    longURL: receivedLongURL,
    userID: generatedShort
  }
  res.redirect(`urls/${generatedShort}`);
});

// for testing: http://localhost:8080/u/sgq3y6
// Method for deleting URLs from urls_index.ejs
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    const usersURLs = getUserDatabaseByUser(user.id);
    const shortURLToDelete = req.params.shortURL;
    if (usersURLs[shortURLToDelete]) {
      delete urlDatabase[shortURLToDelete];
      return res.redirect('urls');
    }
  }
  return res.status(403).send('URL requested for deletion not found in your account');
});

// Method for updating URLs from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  res.redirect('/urls');  
  const user = users[req.cookies.user_id];
  if (user) {
    const usersURLs = getUserDatabaseByUser(user.id);
    const shortURLToEdit = req.params.id;
    if (usersURLs[shortURLToEdit]) {
      urlDatabase[shortURLToEdit].longURL = req.body.originalURL;
      return res.redirect('/urls');
    }
  }
  return res.status(403).send('URL requested for deletion not found in your account');
});

// Method for logging out
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

// Method for logging in (receiving email and password from text input fields in _header.ejs)
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  // const { enteredEmail, enteredPassword } = req.body;
  console.log(enteredEmail);
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  let userObject = userAuthenticated(enteredEmail, enteredPassword);
  if (userObject) {
    // res.cookie("user_id", userObject.id);
    return res.redirect('/urls')
  }
  // if not authenticated throw a 403 error
  return res.status(403).send('Error. Please Try Again');
});

// New Method for registering - on page 'login_page.ejs'
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, salt);
  // validate email and password entries. if not valid, redirect to registration page again
  if (!validateInputs(enteredEmail, enteredPassword)) {
    console.log('Please try again');
    // TO DO: pass an object for registration page html to render and incorrect entry
    // CHANGE TO If incorrect entry cookie, send error
    return res.status(403).send('Error. Please Try Again');
  }
  
  const userObject = getUserObjectByEmail(enteredEmail);
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


  // if user doesn't exist in the database, create a new cookie and create a new user object in database
    // new cookie:
  const userRandomID = generateRandomString();
  // res.cookie("user_id", userRandomID);
    // create a database entry
  let userToAdd = {
    id: userRandomID, 
    email: enteredEmail, 
    password: hashedPassword
  }
    // add object to database
  users[userRandomID] = userToAdd;
  console.log('no match in database, created a new user');
  console.log(userToAdd);
    // redirect to urls
  res.redirect('/urls');
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
