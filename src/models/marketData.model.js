import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class MarketData extends Model {}

MarketData.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    open: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    high: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    low: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    close: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MarketData',
    tableName: 'market_data',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['stock_id', 'date'],
        name: 'unique_stock_date',
      },
    ],
  }
);

export default MarketData;

