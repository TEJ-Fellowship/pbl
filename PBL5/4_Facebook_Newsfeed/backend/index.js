const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/user');

const app = express();

// Sync database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced successfully');
}).catch((error) => {
  console.error('Error syncing database:', error);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});