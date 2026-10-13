/**
 * Migration: Add reset_password_otp and reset_password_otp_expires_at to users table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'reset_password_otp', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'reset_password_otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'reset_password_otp');
    await queryInterface.removeColumn('users', 'reset_password_otp_expires_at');
  },
};
