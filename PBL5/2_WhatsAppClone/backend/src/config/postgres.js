// PostgreSQL database configuration
import { DATABASE_URL } from './index.js';

import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

const sequelize = new Sequelize(DATABASE_URL, {
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
                glob: 'src/infrastructure/db/migrations/*.js',
                resolve: ({ name, path, context }) => {
                    // For ES modules, we need to dynamically import
                    const migration = import(path);
                    return {
                        name,
                        up: async () => {
                            const m = await migration;
                            return m.default.up({ context });
                        },
                        down: async () => {
                            const m = await migration;
                            return m.default.down({ context });
                        }
                    };
                }
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

export { connectToDatabase, sequelize };