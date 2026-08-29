import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'halalfy_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT) || 3306;

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? false : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    // Auto-create database if it doesn't already exist
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    // Authenticate Sequelize connection
    await sequelize.authenticate();
    console.log(`MySQL Database '${dbName}' connected successfully with Sequelize.`);
  } catch (error) {
    console.error('Unable to connect to MySQL database:', error.message);
    process.exit(1);
  }
};

export default connectDB;
