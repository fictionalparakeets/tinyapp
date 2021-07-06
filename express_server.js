const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


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
  res.render('pages/index');
});

// Pages Render - URL Index (full database)
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('pages/urls_index', templateVars);
});

// Pages Render - Create a new URL
app.get("/urls/new", (req, res) => {
  // data from input field =  req.body.longURL 
  // const templateVarsThree = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('pages/urls_new');
});

// Pages Render - Detail for each URL in the database
app.get("/urls/:shortURL", (req, res) => {
  const templateVarsTwo = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('pages/urls_show', templateVarsTwo);
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
  // console.log('req.params.id: ', req.params.id)
  // console.log('req.params.originalURL: ', req.params.originalURL);
  urlDatabase[req.params.id] = req.body.originalURL;
  res.redirect('/urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
