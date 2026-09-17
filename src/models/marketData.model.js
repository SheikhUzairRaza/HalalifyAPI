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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    open: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    high: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    low: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    close: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    fetched_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
        name: 'market_data_stock_id_date_unique',
      },
    ],
  }
);

export default MarketData;

