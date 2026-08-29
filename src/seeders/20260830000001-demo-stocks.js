/**
 * Seeder: Seed initial tracked stock tickers
 */
const demoStocksSeeder = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'stocks',
      [
        {
          id: 'a1b2c3d4-e5f6-47a8-b901-234567890123',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          exchange: 'NASDAQ',
          country: 'US',
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'b2c3d4e5-f6a7-48b9-8012-345678901234',
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          sector: 'Technology',
          exchange: 'NASDAQ',
          country: 'US',
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'c3d4e5f6-a7b8-49c0-9123-456789012345',
          ticker: 'NVDA',
          name: 'NVIDIA Corporation',
          sector: 'Technology',
          exchange: 'NASDAQ',
          country: 'US',
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'd4e5f6a7-b8c9-40d1-a234-567890123456',
          ticker: 'AMZN',
          name: 'Amazon.com Inc.',
          sector: 'Consumer Cyclical',
          exchange: 'NASDAQ',
          country: 'US',
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'e5f6a7b8-c9d0-41e2-b345-678901234567',
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          sector: 'Communication Services',
          exchange: 'NASDAQ',
          country: 'US',
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stocks', {
      ticker: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'],
    });
  },
};

export default demoStocksSeeder;

