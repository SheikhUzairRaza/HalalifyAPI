import Sequelize from 'sequelize';
import { sequelize } from '../config/db.js';
import addOAuthFieldsMigration from './20260829000002-add-google-oauth-fields.js';

const runSpecificMigration = async () => {
  try {
    console.log('🚀 Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully.');

    console.log('🔄 Executing migration 20260829000002-add-google-oauth-fields.js...');
    const queryInterface = sequelize.getQueryInterface();

    try {
      await addOAuthFieldsMigration.up(queryInterface, Sequelize);
      console.log('✅ Migration 20260829000002-add-google-oauth-fields.js executed successfully!');
    } catch (migError) {
      if (migError.message && (migError.message.includes('Duplicate column') || migError.message.includes('already exists'))) {
        console.log('ℹ️ Migration columns already exist in MySQL table. Syncing model structure...');
        await sequelize.sync({ alter: true });
        console.log('✅ Schema successfully verified & synchronized.');
      } else {
        throw migError;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Migration execution failed:', error.message);
    process.exit(1);
  }
};

runSpecificMigration();

