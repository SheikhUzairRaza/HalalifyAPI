import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class StockFeature extends Model {}

StockFeature.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'stocks',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    ticker: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    pe_ratio: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    debt_to_equity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    market_cap: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: true,
    },
    raw_ratios: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    last_ratios_sync: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'StockFeature',
    tableName: 'features',
    timestamps: true,
    underscored: true,
  }
);

export default StockFeature;

