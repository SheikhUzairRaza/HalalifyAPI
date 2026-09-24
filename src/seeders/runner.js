import { sequelize } from '../config/db.js';
import demoUsersSeeder from './20260829000001-demo-users.js';
import demoStocksSeeder from './20260830000001-demo-stocks.js';

const runSeeders = async () => {
  try {
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    const queryInterface = sequelize.getQueryInterface();

    console.log('Seeding demo users...');
    await demoUsersSeeder.up(queryInterface, sequelize.Sequelize);

    console.log('Seeding tracked demo stocks (AAPL, MSFT, NVDA, AMZN, GOOGL)...');
    await demoStocksSeeder.up(queryInterface, sequelize.Sequelize);

    console.log('All seeders executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

runSeeders();
