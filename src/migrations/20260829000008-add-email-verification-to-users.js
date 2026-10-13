/**
 * Migration: Add email verification columns (is_email_verified, verification_otp, verification_otp_expires_at) to users table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'verification_otp', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'verification_otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_email_verified');
    await queryInterface.removeColumn('users', 'verification_otp');
    await queryInterface.removeColumn('users', 'verification_otp_expires_at');
  },
};
