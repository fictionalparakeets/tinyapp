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

// Pages Render - Index
app.get("/", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"]
  };
  res.render('pages/index', templateVars);
});

// Pages Render - URL Index (full database)
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('pages/urls_index', templateVars);
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"]
  };
  res.render('pages/urls_new', templateVars);
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render('pages/urls_show', templateVars);
});

// Method for directing to the longURL website when a shortURL is entered in address "/u/shortURL"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

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

// Method for logging in (receiving username from text input field)
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Method for logging out
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
