const sequelize = require('./database');
require("../models/index")

// Test database connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({alter:true});
        console.log('Database synced successfully');
        return true;
    } catch (error) {
        console.error('Error syncing database:', error);
        throw error;
    }
}

module.exports = connectDB;