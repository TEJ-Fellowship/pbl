// PostgreSQL database configuration

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const runMigrations = async () => {
    try {
        const migrator = new Umzug({
            migrations: {
                glob: 'src/infrastructure/db/migrations/*.js'
            },
            storage: new SequelizeStorage({ sequelize }),
            context: sequelize.getQueryInterface(),
        });
        await migrator.up();
        console.log('Migrations up to date');
    } catch (error) {
        console.error('Unable to run migrations:', error);
        process.exit(1);
    }
};

const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');
        await runMigrations();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    return sequelize;
}

module.exports = { connectToDatabase, sequelize };