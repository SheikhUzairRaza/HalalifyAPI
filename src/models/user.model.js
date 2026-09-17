import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/db.js';
import { env } from '../config/env.js';

export class User extends Model {
  /**
   * Compare candidate password with stored hash
   * @param {string} candidatePassword
   * @returns {Promise<boolean>}
   */
  async comparePassword(candidatePassword) {
    if (!this.password_hash) {
      return false;
    }
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  /**
   * Generate JWT Access Token
   * @returns {string}
   */
  generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        name: this.name,
      },
      env.jwt.accessSecret,
      {
        expiresIn: env.jwt.accessExpiry,
      }
    );
  }

  /**
   * Generate JWT Refresh Token
   * @returns {string}
   */
  generateRefreshToken() {
    return jwt.sign(
      {
        id: this.id,
      },
      env.jwt.refreshSecret,
      {
        expiresIn: env.jwt.refreshExpiry,
      }
    );
  }

  /**
   * Hide sensitive fields when serializing model instance
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.refresh_token;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for Google OAuth users
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    auth_provider: {
      type: DataTypes.ENUM('local', 'google'),
      allowNull: false,
      defaultValue: 'local',
    },
    // Onboarding Q1: risk comfort (low / medium / high)
    risk_preference: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    // Onboarding Q2: why are you investing
    investment_goal: {
      type: DataTypes.ENUM('grow_savings', 'regular_income', 'just_exploring'),
      allowNull: false,
      defaultValue: 'grow_savings',
    },
    // Onboarding Q3: Shariah screening mode
    screening_strictness: {
      type: DataTypes.ENUM('standard', 'strict'),
      allowNull: false,
      defaultValue: 'standard',
    },
    onboarding_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.password_hash && user.changed('password_hash')) {
          const saltRounds = 10;
          user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
        }
      },
    },
  }
);

export default User;
