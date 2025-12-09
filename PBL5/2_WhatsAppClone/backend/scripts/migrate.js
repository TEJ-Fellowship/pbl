import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import { DATABASE_URL } from '../src/config/index.js';

const sequelize = new Sequelize(DATABASE_URL, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const runMigrations = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    const migrator = new Umzug({
      migrations: {
        glob: 'src/infrastructure/db/migrations/*.js',
        resolve: ({ name, path, context }) => {
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
            },
          };
        },
      },
      storage: new SequelizeStorage({ sequelize }),
      context: sequelize.getQueryInterface(),
      logger: console,
    });

    console.log('Running migrations...');
    const migrations = await migrator.up();
    
    if (migrations.length === 0) {
      console.log('✅ No new migrations to run. Database is up to date.');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(m => console.log(`   - ${m.name}`));
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

runMigrations();