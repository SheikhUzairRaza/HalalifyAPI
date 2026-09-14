import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Halalfy Backend API',
    version: '1.0.0',
    description: 'Shariah-Compliant AI Investment Platform REST API Documentation',
    contact: {
      name: 'Halalfy Support',
      email: 'support@halalfy.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Access Token (without "Bearer " prefix)',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object', nullable: true },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Error message description' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4a1e-8e54-9447e1741872' },
          name: { type: 'string', minLength: 3, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          avatar_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://lh3.googleusercontent.com/a/default-user',
          },
          auth_provider: {
            type: 'string',
            enum: ['local', 'google'],
            example: 'google',
          },
          risk_preference: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'medium',
          },
          investment_goal: {
            type: 'string',
            enum: ['grow_savings', 'regular_income', 'just_exploring'],
            example: 'grow_savings',
          },
          screening_strictness: {
            type: 'string',
            enum: ['standard', 'strict'],
            example: 'standard',
          },
          onboarding_completed: { type: 'boolean', example: false },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Stock: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          ticker: { type: 'string', example: 'AAPL' },
          name: { type: 'string', example: 'Apple Inc. Common Stock' },
          sector: { type: 'string', nullable: true, example: 'Technology' },
          exchange: { type: 'string', nullable: true, example: 'NASDAQ' },
          is_active: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponseData: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      GoogleAuthRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: {
            type: 'string',
            description: 'Firebase ID Token obtained from Google Sign-In on frontend',
            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      OnboardingRequest: {
        type: 'object',
        description: 'Submit choices or empty body {} to skip and use safe defaults',
        properties: {
          risk_preference: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium',
            example: 'low',
          },
          investment_goal: {
            type: 'string',
            enum: ['grow_savings', 'regular_income', 'just_exploring'],
            default: 'grow_savings',
            example: 'grow_savings',
          },
          screening_strictness: {
            type: 'string',
            enum: ['standard', 'strict'],
            default: 'standard',
            example: 'strict',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
