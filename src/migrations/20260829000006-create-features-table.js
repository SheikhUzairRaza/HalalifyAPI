/**
 * Migration: Create Features Table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'features',
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
        debt_ratio: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
        },
        pe_ratio: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
        },
        market_cap: {
          type: Sequelize.DECIMAL(20, 2),
          allowNull: true,
        },
        technical_indicators: {
          type: Sequelize.JSON,
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
      },
      {
        uniqueKeys: {
          features_stock_id_date_unique: {
            fields: ['stock_id', 'date'],
          },
        },
      }
    );

    // Create composite unique index on (stock_id, date) for upserting
    await queryInterface.addIndex('features', ['stock_id', 'date'], {
      unique: true,
      name: 'features_stock_id_date_unique',
    }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('features');
  },
};
