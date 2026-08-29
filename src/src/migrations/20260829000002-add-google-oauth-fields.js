/**
 * Migration: Add Google OAuth and Refresh Token fields to Users table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'avatar_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'auth_provider', {
      type: Sequelize.ENUM('local', 'google'),
      allowNull: false,
      defaultValue: 'local',
    });

    await queryInterface.addColumn('users', 'refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'avatar_url');
    await queryInterface.removeColumn('users', 'auth_provider');
    await queryInterface.removeColumn('users', 'refresh_token');
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};

