/**
 * Migration: Add debt_to_assets (NUMERIC(8,4), nullable) column to features table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('features', 'debt_to_assets', {
      type: Sequelize.DECIMAL(8, 4),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('features', 'debt_to_assets');
  },
};
