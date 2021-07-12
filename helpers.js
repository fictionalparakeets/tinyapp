const bcrypt = require('bcryptjs');


// generate random strings for new short URLs
const generateRandomString = function() {
  let string = '';
  while (string.length < 6) {
    const randomValue = Math.floor(Math.random() * 34) + 2;
    const randomValTo36 = Math.random().toString(randomValue).substr(2, 6);
    string += randomValTo36;
  }
  return string;
};

const getDatabaseObjectByUserID = function(userID, database) {
  const databaseObject = {};
  for (const objectKey in database) {
    if (database[objectKey].id === userID) {
      databaseObject[objectKey] = database[objectKey];
    }
  }
  return databaseObject;
};

const getUserByEmail = function(enteredEmail, database) {
  for (const userInDatabase in database) {
    if (enteredEmail === database[userInDatabase].email) {
      return database[userInDatabase];
    }
  }
  return false;
};

const userAuthenticated = function(enteredHashedPassword, databasePassword) {
  const passwordsMatch = bcrypt.compareSync(enteredHashedPassword, databasePassword);
  if (passwordsMatch) {
    return true;
  }
  return false;
};

const doesEmailExist = function(enteredEmail, database) {
  return getUserByEmail(enteredEmail, database);
};

module.exports = {
  generateRandomString,
  getDatabaseObjectByUserID,
  getUserByEmail,
  userAuthenticated,
  doesEmailExist
};
