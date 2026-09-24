import { sequelize } from '../config/db.js';
import User from './user.model.js';
import UserToken from './userToken.model.js';
import Stock from './stock.model.js';
import MarketData from './marketData.model.js';
import Feature from './feature.model.js';

// Setup associations for multi-device token management
User.hasMany(UserToken, { foreignKey: 'user_id', as: 'tokens' });
UserToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Stock <-> MarketData Association (1-to-Many)
Stock.hasMany(MarketData, {
  foreignKey: 'stock_id',
  as: 'marketData',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
MarketData.belongsTo(Stock, {
  foreignKey: 'stock_id',
  as: 'stock',
});

// Stock <-> Feature Association (1-to-Many)
Stock.hasMany(Feature, {
  foreignKey: 'stock_id',
  as: 'features',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Feature.belongsTo(Stock, {
  foreignKey: 'stock_id',
  as: 'stock',
});

const db = {
  sequelize,
  User,
  UserToken,
  Stock,
  MarketData,
  Feature,
};

export { sequelize, User, UserToken, Stock, MarketData, Feature };
export default db;
