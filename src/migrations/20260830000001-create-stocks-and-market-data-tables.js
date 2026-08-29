/**
 * Migration: Create stocks, market_data, and features tables for Stock Data Module
 */
export default {
  async up(queryInterface, Sequelize) {
    // 1. Create stocks table
    await queryInterface.createTable('stocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ticker: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sector: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      exchange: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_profile_sync: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // 2. Create market_data table
    await queryInterface.createTable('market_data', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      stock_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stocks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      ticker: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      open: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
      },
      high: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
      },
      low: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
      },
      close: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Composite unique index to avoid duplicating market data for same stock on same day
    await queryInterface.addIndex('market_data', ['stock_id', 'date'], {
      unique: true,
      name: 'unique_stock_date',
    });

    // 3. Create features table
    await queryInterface.createTable('features', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      stock_id: {
        type: Sequelize.UUID,
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
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      pe_ratio: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      debt_to_equity: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      market_cap: {
        type: Sequelize.DECIMAL(20, 4),
        allowNull: true,
      },
      raw_ratios: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      last_ratios_sync: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('features');
    await queryInterface.dropTable('market_data');
    await queryInterface.dropTable('stocks');
  },
};

