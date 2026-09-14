import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class Stock extends Model {}

Stock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    ticker: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    exchange: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Stock',
    tableName: 'stocks',
    timestamps: true,
    underscored: true,
  }
);

export default Stock;

