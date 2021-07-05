const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
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
  return randomValTo36
};

// Pages
app.get("/", (req, res) => {
  res.render('pages/index');
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('pages/urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  // data from input field =  req.body.longURL 
  // const templateVarsThree = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('pages/urls_new');
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  // RAW = longURL=test.com%2Ftest22
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVarsTwo = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('pages/urls_show', templateVarsTwo);
});

console.log(generateRandomString);
console.log(generateRandomString);
console.log(generateRandomString);
console.log(generateRandomString);
console.log(generateRandomString);
console.log(generateRandomString);






app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
