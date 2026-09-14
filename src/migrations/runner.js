import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Sequelize from 'sequelize';
import { sequelize } from '../config/db.js';
import addOAuthFieldsMigration from './20260829000002-add-google-oauth-fields.js';

const runSpecificMigration = async () => {
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runAllMigrations = async () => {
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
    // Ensure SequelizeMeta table exists to track executed migrations
    await queryInterface.createTable(
      'SequelizeMeta',
      {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true,
        },
      },
      {
        logging: false,
      }
    ).catch(() => {});

    // Get list of already executed migrations
    const [executedRows] = await sequelize.query('SELECT name FROM `SequelizeMeta`', {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
    }).catch(() => [[]]);

    const executedNames = new Set((executedRows || []).map((r) => r.name || r.NAME));

    // Read all migration files in src/migrations
    const files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith('.js') && file !== 'runner.js')
      .sort();

    let migratedCount = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        continue;
      }

      console.log(`🔄 Executing migration: ${file}...`);
      const filePath = path.join(__dirname, file);
      const fileUrl = pathToFileURL(filePath).href;
      const migrationModule = await import(fileUrl);
      const migration = migrationModule.default || migrationModule;

      if (typeof migration.up === 'function') {
        try {
          await migration.up(queryInterface, Sequelize);
          await sequelize.query('INSERT INTO `SequelizeMeta` (`name`) VALUES (:name)', {
            replacements: { name: file },
            type: Sequelize.QueryTypes.INSERT,
          });
          console.log(`✅ ${file} executed successfully.`);
          migratedCount++;
        } catch (migErr) {
          // If table/column already exists, record it and continue
          if (
            migErr.message &&
            (migErr.message.includes('already exists') ||
              migErr.message.includes('Duplicate column') ||
              migErr.message.includes('Table') && migErr.message.includes('already exists'))
          ) {
            console.log(`ℹ️ Schema already present for ${file}, marking as executed.`);
            await sequelize.query('INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES (:name)', {
              replacements: { name: file },
              type: Sequelize.QueryTypes.INSERT,
            }).catch(() => {});
          } else {
            throw migErr;
          }
        }
      }
    }

    if (migratedCount === 0) {
      console.log('✨ No pending migrations. Database is up to date.');
    } else {
      console.log(`🎉 Successfully executed ${migratedCount} migration(s).`);
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Migration execution failed:', error.message);
    console.error('💥 Migration runner error:', error.message);
    process.exit(1);
  }
};

runSpecificMigration();

runAllMigrations();
