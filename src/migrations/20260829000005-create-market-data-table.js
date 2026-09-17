/**
 * Migration: Create Market Data Table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'market_data',
      {
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
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        open: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false,
        },
        high: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false,
        },
        low: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false,
        },
        close: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false,
        },
        volume: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: 0,
        },
        fetched_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      },
      {
        uniqueKeys: {
          market_data_stock_id_date_unique: {
            fields: ['stock_id', 'date'],
          },
        },
      }
    );

    // Create composite unique index on (stock_id, date)
    await queryInterface.addIndex('market_data', ['stock_id', 'date'], {
      unique: true,
      name: 'market_data_stock_id_date_unique',
    }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('market_data');
  },
};

