const bcrypt = require('bcrypt');

// Helper function to generate random strings for short URLs
const generateRandomString = function() {
  let string = '';
  while (string.length < 6) {
    const randomValue = Math.floor(Math.random() * 34) + 2;
    const randomValTo36 = Math.random().toString(randomValue).substr(2, 6);
    string += randomValTo36;
  }
  return string;
};

// Helper function to iterate over urls database and return each user's collection of urls
const getDatabaseObjectByUserID = function(userID, database) {
  const databaseObject = {};
  for (const objectKey in database) {
    if (database[objectKey].id === userID) {
      databaseObject[objectKey] = database[objectKey];
    }
  }
  return databaseObject;
};

// Helper functions for authenticating users // returns the user.id
const getUserByEmail = function(enteredEmail, database) {
  for (const userInDatabase in database) {
    if (enteredEmail === database[userInDatabase].email) {
      return database[userInDatabase];
    }
  }
  return false;
};

// Helper functions for authenticating users
const userAuthenticated = function(enteredPassword, databasePassword) {
  const passwordsMatch = bcrypt.compareSync(enteredPassword, databasePassword);
  if (passwordsMatch) {
    // res.cookie(error) ? res.clearCookie(error) : null;
    return true;
  }
  return false;
};

const doesEmailExist = function(enteredEmail, database) {
  const truthy = getUserByEmail(enteredEmail, database) ? true : false;
  return (truthy);
};

module.exports = {
  generateRandomString,
  getDatabaseObjectByUserID,
  getUserByEmail,
  userAuthenticated,
  doesEmailExist
};