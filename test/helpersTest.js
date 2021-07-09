const { assert, expect } = require('chai');

const { 
  getUserByEmail,
  getDatabaseObjectByUserID,
  doesEmailExist
 } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const userID = user.id;
    const expectedOutput = "userRandomID";
    assert.strictEqual(expectedOutput, userID);
  });
});

describe('getUserByEmail', function() {
  it('should return undefined when given an email that isn\'t in the database', function() {
    const user = getUserByEmail("userffddfdfsa@example.com", testUsers);
    const userID = user.id;
    const expectedOutput = undefined;
    assert.strictEqual(expectedOutput, userID);
  });
});


describe('getDatabaseObjectByUserID', function() {
  it('should return the database object matching the parameter', function() {
    const userObject = getDatabaseObjectByUserID("user2RandomID", testUsers);
    expect(userObject).to.be.a('object');
  });
});

// write a better test for this
describe('doesEmailExist', function() {
  it('should return true if the database contains the entered email', function() {
    const user = doesEmailExist("user@example.com", testUsers);
    const nonUser = doesEmailExist("usessdfddr@example.com", testUsers);
    const expectedOutput1 = true;
    const expectedOutput2 = false;
    assert.equal(expectedOutput1, user);
    assert.equal(expectedOutput2, nonUser);
  });
});
