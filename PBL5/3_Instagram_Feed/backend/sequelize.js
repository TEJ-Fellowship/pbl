import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('demo', 'postgres', '0987', {
  host: 'localhost',
  dialect: 'postgres',
});

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

// Example: define a model
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  age: DataTypes.INTEGER,
});

// Sync with database
await sequelize.sync();

// Insert example
await User.create({ name: 'Alice', age: 25 });

// Query example
const users = await User.findAll();
console.log(users.map(u => u.toJSON()));
