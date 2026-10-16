import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class ComplianceCheck extends Model {}

ComplianceCheck.init(
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
    strictness_mode: {
      type: DataTypes.ENUM('standard', 'strict'),
      allowNull: false,
    },
    is_compliant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    sector_pass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    debt_pass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    debt_to_assets_used: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
    },
    sector_used: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ComplianceCheck',
    tableName: 'compliance_checks',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['stock_id', 'strictness_mode'],
        name: 'compliance_checks_stock_id_strictness_mode_unique',
      },
    ],
  }
);

export default ComplianceCheck;
