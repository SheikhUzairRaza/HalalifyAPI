import { sequelize } from '../config/db.js';
import User from './user.model.js';
import UserToken from './userToken.model.js';

// Setup associations for multi-device token management
User.hasMany(UserToken, { foreignKey: 'user_id', as: 'tokens' });
UserToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  User,
  UserToken,
};

export { sequelize, User, UserToken };
export default db;
