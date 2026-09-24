import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class Feature extends Model {}

Feature.init(
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
    debt_ratio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    pe_ratio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    market_cap: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    technical_indicators: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Feature',
    tableName: 'features',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['stock_id', 'date'],
        name: 'features_stock_id_date_unique',
      },
    ],
  }
);

export default Feature;
