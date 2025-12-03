const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Generate realistic usernames and write to CSV
const generateUsernamesToCSV = () => {
  const csvPath = path.join(__dirname, 'dummyData/user.csv');
  const numUsernames = 700; // Generate 700 usernames
  
  // Array to store generated usernames
  const usernames = [];
  
  // Generate realistic usernames using various faker methods
  for (let i = 0; i < numUsernames; i++) {
    let username;
    
    // Use different patterns for variety
    const pattern = faker.number.int({ min: 1, max: 4 });
    
    switch (pattern) {
      case 1:
        // Pattern: firstname_lastname_number
        username = `${faker.person.firstName().toLowerCase()}_${faker.person.lastName().toLowerCase()}${faker.number.int({ min: 1, max: 999 })}`;
        break;
      case 2:
        // Pattern: firstname.number
        username = `${faker.person.firstName().toLowerCase()}${faker.number.int({ min: 10, max: 9999 })}`;
        break;
      case 3:
        // Pattern: lastname_firstname
        username = `${faker.person.lastName().toLowerCase()}_${faker.person.firstName().toLowerCase()}`;
        break;
      case 4:
        // Pattern: adjective_noun_number (more creative)
        username = `${faker.word.adjective().toLowerCase()}_${faker.word.noun().toLowerCase()}${faker.number.int({ min: 1, max: 99 })}`;
        break;
    }
    
    // Ensure username is 3-50 chars (per your model)
    username = username.substring(0, 50);
    
    // Ensure minimum length of 3
    if (username.length < 3) {
      username = username + faker.string.alphanumeric(3 - username.length);
    }
    
    usernames.push(username);
  }
  
  // Write to CSV file with header
  const csvContent = 'username\n' + usernames.join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`Generated ${numUsernames} usernames and saved to ${csvPath}`);
};

// Generate usernames when module is loaded
generateUsernamesToCSV();

// Export function for Artillery to use during tests
module.exports = {
  generateUser: function(context, events, done) {
    // Generate a new username for the current test
    const firstName = faker.person.firstName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();
    const randomNum = faker.number.int({ min: 100, max: 99999 });
    
    // Ensure username is 3-50 chars (per your model)
    const username = `${firstName}_${lastName}_${randomNum}`.substring(0, 50);
    
    context.vars.username = username;
    
    return done();
  }
};