/**
 * Migration: Create compliance_checks Table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'compliance_checks',
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
        strictness_mode: {
          type: Sequelize.ENUM('standard', 'strict'),
          allowNull: false,
        },
        is_compliant: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        sector_pass: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        debt_pass: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        debt_to_assets_used: {
          type: Sequelize.DECIMAL(8, 4),
          allowNull: true,
        },
        sector_used: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        checked_at: {
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
          compliance_checks_stock_id_strictness_mode_unique: {
            fields: ['stock_id', 'strictness_mode'],
          },
        },
      }
    );

    // Composite unique index on (stock_id, strictness_mode) for upserts
    await queryInterface
      .addIndex('compliance_checks', ['stock_id', 'strictness_mode'], {
        unique: true,
        name: 'compliance_checks_stock_id_strictness_mode_unique',
      })
      .catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('compliance_checks');
  },
};
