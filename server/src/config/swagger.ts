import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ProjectPilot REST & Realtime API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API documentation for ProjectPilot — Jira/Trello hybrid project management platform.',
    contact: {
      name: 'ProjectPilot Engineering Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API base URL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
          name: { type: 'string', example: 'Alex Developer' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          avatar: { type: 'string' },
          bio: { type: 'string' },
          timezone: { type: 'string', example: 'UTC' },
          isEmailVerified: { type: 'boolean', example: true },
        },
      },
      Issue: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          key: { type: 'string', example: 'PROJ-101' },
          title: { type: 'string', example: 'Implement optimistic concurrency control' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['task', 'bug', 'story', 'epic'] },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['lowest', 'low', 'medium', 'high', 'highest'] },
          version: { type: 'integer', example: 1 },
          position: { type: 'number', example: 1000 },
          storyPoints: { type: 'number', example: 5 },
          assignee: { $ref: '#/components/schemas/User' },
          reporter: { $ref: '#/components/schemas/User' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userAgent: { type: 'string' },
          ipAddress: { type: 'string' },
          lastActiveAt: { type: 'string', format: 'date-time' },
          isCurrent: { type: 'boolean' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          action: { type: 'string', example: 'member_invited' },
          entityType: { type: 'string', example: 'invitation' },
          entityId: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
    {
      CookieAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
