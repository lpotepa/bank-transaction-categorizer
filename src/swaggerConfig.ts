// src/swaggerConfig.ts
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Add some basic configuration for your API docs
export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bank Transaction Categorizer API',
    version: '1.0.0',
    description: 'API for handling and categorizing bank transactions',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const generator = new OpenApiGeneratorV3(registry.definitions);

// Generate the full OpenAPI document
export const openApiDocument = generator.generateDocument(swaggerDefinition);
