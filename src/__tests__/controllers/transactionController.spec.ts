import request from 'supertest';
import { app, server } from '../../index';
import { AppDataSource } from '../../../ormconfig';
import { Transaction } from '../../models/Transaction';
import { categorizeQueue } from '../../queue/categorizeQueue';
import { setupTestDB } from '../../../jest.setup';

jest.mock('bull', () => {
    return jest.fn().mockImplementation(() => {
        return {
            add: jest.fn()
        };
    });
});

beforeAll(async () => {
    await setupTestDB(); 
});

afterEach(async () => {
    const entities = AppDataSource.entityMetadatas;

    for (const entity of entities) {
        const repository = AppDataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
    }
    jest.clearAllMocks();
});

afterAll(async () => {
    await AppDataSource.destroy();

    if (server) {
        server.close();
    }
});

describe('POST /transactions', () => {
    it('should create a new transaction and return 202', async () => {
        const transactionData = {
            transactionId: 'TXN00001',
            amount: 100.0,
            timestamp: '2024-08-15T09:56:48.000Z',
            description: 'Test Transaction',
            transactionType: 'debit',
            accountNumber: 'NLINGB123456789',
        };

        const response = await request(app).post('/transactions').send(transactionData);

        expect(response.status).toBe(202);
        expect(response.body.transactionId).toBe('TXN00001');
        expect(categorizeQueue.add).toHaveBeenCalledWith({
            transactionId: 'TXN00001',
            description: 'Test Transaction',
        },
        { attempts: 3 });
    });

    it('should return 409 if transactionId already exists', async () => {
        // First, create a transaction
        await AppDataSource.getRepository(Transaction).insert({
            transactionId: 'TXN00002',
            amount: 200.0,
            timestamp: new Date(),
            description: 'Duplicate Transaction',
            transactionType: 'debit',
            accountNumber: 'NLINGB123456789',
        });

        const transactionData = {
            transactionId: 'TXN00002',
            amount: 200.0,
            timestamp: '2024-08-15T09:56:48.000Z',
            description: 'Duplicate Transaction',
            transactionType: 'debit',
            accountNumber: 'NLINGB123456789',
        };

        const response = await request(app).post('/transactions').send(transactionData);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Transaction with ID TXN00002 already exists.');
    });

    it('should return 202 and queue CSV ile processing when a file is uploaded', async () => {
        const response = await request(app)
            .post('/transactions')
            .attach('file', Buffer.from('TransactionID,Amount,Timestamp,Description,Transaction Type,Account Number'), 'transactions.csv');

        expect(response.status).toBe(202);
        expect(response.body.message).toBe('CSV file received. Processing has been queued.');
        expect(categorizeQueue.add).toHaveBeenCalled();
    });
});

describe('GET /transactions', () => {
    it('should retrieve all transactions', async () => {
        // Insert some transactions for testing
        await AppDataSource.getRepository(Transaction).insert([
            {
                transactionId: 'TXN00003',
                amount: 150.0,
                timestamp: new Date(),
                description: 'Test Transaction 3',
                transactionType: 'credit',
                accountNumber: 'NLINGB876543210',
            },
            {
                transactionId: 'TXN00004',
                amount: 50.0,
                timestamp: new Date(),
                description: 'Test Transaction 4',
                transactionType: 'debit',
                accountNumber: 'NLINGB987654321',
            },
        ]);

        const response = await request(app).get('/transactions');

        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThanOrEqual(2); // Ensure transactions are retrieved
    });
});

describe('GET /transactions/:id', () => {
    it('should retrieve a transaction by ID', async () => {
        const transactionId = 'TXN00005';

        // Insert a transaction for testing
        await AppDataSource.getRepository(Transaction).insert({
            transactionId,
            amount: 300.0,
            timestamp: new Date(),
            description: 'Test Transaction 5',
            transactionType: 'credit',
            accountNumber: 'NLINGB0987654321',
        });

        const response = await request(app).get(`/transactions/${transactionId}`);

        expect(response.status).toBe(200);
        expect(response.body.transactionId).toBe(transactionId);
    });

    it('should return 404 if the transaction does not exist', async () => {
        const response = await request(app).get('/transactions/INVALID_ID');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Transaction not found');
    });
});
