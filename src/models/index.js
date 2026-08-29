import { sequelize } from '../config/db.js';
import User from './user.model.js';

// Setup model associations here as other models are added
const db = {
  sequelize,
  User,
};

export { sequelize, User };
export default db;

