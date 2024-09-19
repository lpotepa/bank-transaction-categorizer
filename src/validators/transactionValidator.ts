import {z} from '../lib/zod'

export const createTransactionSchema = z.object({
  transactionId: z.string().openapi({ example: 'TXN00001', description: 'Unique transaction identifier' }),
  amount: z.number().openapi({ example: 100.50, description: 'Transaction amount' }),
  timestamp: z.string().openapi({ example: '2024-08-15T09:56:48.000Z', description: 'Transaction timestamp' }),
  description: z.string().openapi({ example: 'Payment for groceries', description: 'Transaction description' }),
  transactionType: z.enum(['debit', 'credit']).openapi({ example: 'debit', description: 'Transaction type' }),
  accountNumber: z.string().openapi({ example: 'NLINGB123456789', description: 'Account number' }),
}).openapi('CreateTransaction');
