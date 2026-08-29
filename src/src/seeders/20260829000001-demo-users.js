import bcrypt from 'bcrypt';

/**
 * Demo Users Seeder
 */
const demoUsersSeeder = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Password123!', saltRounds);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: 'd3b07384-d113-4a1e-8e54-9447e1741872',
          name: 'Demo Investor',
          email: 'demo@halalfy.com',
          password_hash: hashedPassword,
          auth_provider: 'local',
          avatar_url: null,
          risk_preference: 'medium',
          investment_goal: 'grow_savings',
          screening_strictness: 'standard',
          onboarding_completed: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'e4c18495-e224-5b2f-9f65-0558f2852983',
          name: 'Halal Trader',
          email: 'trader@halalfy.com',
          password_hash: hashedPassword,
          auth_provider: 'local',
          avatar_url: null,
          risk_preference: 'high',
          investment_goal: 'regular_income',
          screening_strictness: 'strict',
          onboarding_completed: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: ['demo@halalfy.com', 'trader@halalfy.com'],
    });
  },
};

export default demoUsersSeeder;

