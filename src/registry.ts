// src/registry.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from './lib/zod'; // Use the extended Zod instance
import { createTransactionSchema } from './validators/transactionValidator';

// Create the OpenAPI registry instance
export const registry = new OpenAPIRegistry();

// Define the Transaction model schema
const transactionSchema = registry.register(
  'Transaction',
  createTransactionSchema
);

// Define the CSV upload schema
const csvUploadSchema = registry.register(
  'TransactionCSVUpload',
  z.object({
    file: z
      .any()
      .openapi({
        type: 'string',
        format: 'binary',
        description: 'CSV file containing transactions. The file should follow the specified format. See TransactionCSVUpload schema.',
        example: `Transaction ID,Amount,Timestamp,Description,Transaction Type,Account Number
TXN00001,-87.18,2024-05-16 07:22:18.808433,Municipal Tax Payment,debit,NLINGB1944573686
TXN00002,-269.85,2023-09-03 10:54:45.808433,PayPal Transfer,debit,NLABNA3263982552
TXN00003,-40.28,2024-03-16 23:43:41.808433,Rent Payment,credit,NLINGB3068192988
TXN00004,473.45,2023-12-01 07:14:22.808433,Payment to Rabobank,debit,NLINGB8559012158
TXN00005,170.68,2024-01-03 14:08:30.808433,Tax Refund,debit,NLABNA1588199536`,
      }),
  })
);

// Register the POST /transactions path
registry.registerPath({
  method: 'post',
  path: '/transactions',
  description: 'Submit a new transaction or upload a CSV file containing transactions.',
  summary: 'Create Transaction or Upload CSV',
  request: {
    body: {
      content: {
        'application/json': {
          schema: transactionSchema,
        },
        'multipart/form-data': {
          schema: csvUploadSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    202: {
      description: 'Transaction created successfully or CSV processing queued.',
      content: {
        'application/json': {
          schema: z
            .object({
              message: z
                .string()
                .openapi({ example: 'CSV file received. Processing has been queued.' }),
            })
            .or(transactionSchema),
        },
      },
    },
    400: {
      description: 'Invalid data or Multer error during file upload.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            error: z.any(),
          }),
        },
      },
    },
    409: {
      description: 'Transaction with this ID already exists.',
      content: {
        'application/json': {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: 'Transaction with ID TXN00001 already exists.' }),
          }),
        },
      },
    },
    500: {
      description: 'An unknown error occurred during file upload or while saving transaction.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            error: z.any(),
          }),
        },
      },
    },
  },
});

// Register the GET /transactions path
registry.registerPath({
  method: 'get',
  path: '/transactions',
  description: 'Retrieve all categorized transactions.',
  summary: 'Get All Transactions',
  responses: {
    200: {
      description: 'List of all categorized transactions.',
      content: {
        'application/json': {
          schema: z.array(transactionSchema),
        },
      },
    },
  },
});

// Register the GET /transactions/{id} path
registry.registerPath({
  method: 'get',
  path: '/transactions/{id}',
  description: 'Retrieve a specific transaction by ID.',
  summary: 'Get Transaction By ID',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Transaction ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Transaction details.',
      content: {
        'application/json': {
          schema: transactionSchema,
        },
      },
    },
    404: {
      description: 'Transaction not found.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Transaction not found' }),
          }),
        },
      },
    },
  },
});
