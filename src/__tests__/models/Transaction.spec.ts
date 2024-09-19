import { AppDataSource } from '../../../ormconfig';
import { Transaction } from '../../models/Transaction';
import { Category } from '../../models/Category';

describe('Transaction Model', () => {
  let transactionRepository: any;
  let categoryRepository: any;

  // Initialize the database connection before all tests
  beforeAll(async () => {
    await AppDataSource.initialize();
    transactionRepository = AppDataSource.getRepository(Transaction);
    categoryRepository = AppDataSource.getRepository(Category);
  });

  // Clear the transactions and categories table after each test to ensure isolation
  afterEach(async () => {
    await categoryRepository.query('TRUNCATE TABLE "category" RESTART IDENTITY CASCADE');
    await transactionRepository.query('TRUNCATE TABLE "transaction" RESTART IDENTITY CASCADE');
  });

  // Close the database connection after all tests are done
  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a new transaction', async () => {
    // First, create a category to assign to the transaction
    const category = new Category();
    category.name = 'Groceries';
    const savedCategory = await categoryRepository.save(category);

    // Now, create a transaction and assign the category to it
    const transaction = new Transaction();
    transaction.transactionId = 'TXN00001';
    transaction.amount = 100.0;
    transaction.timestamp = new Date();
    transaction.description = 'Test Transaction';
    transaction.transactionType = 'debit';
    transaction.accountNumber = 'NLINGB123456789';
    transaction.category = savedCategory;  // Assigning category

    const savedTransaction = await transactionRepository.save(transaction);

    expect(savedTransaction).toBeDefined();
    expect(savedTransaction.transactionId).toBe('TXN00001');
    expect(savedTransaction.category).toBeDefined();
    expect(savedTransaction.category.name).toBe('Groceries');
  });

  it('should not allow duplicate transactionId', async () => {
    // First, create a category to assign to the transaction
    const category = new Category();
    category.name = 'Groceries';
    const savedCategory = await categoryRepository.save(category);

    // First transaction
    const transaction1 = new Transaction();
    transaction1.transactionId = 'TXN00002';
    transaction1.amount = 200.0;
    transaction1.timestamp = new Date();
    transaction1.description = 'Duplicate Transaction';
    transaction1.transactionType = 'debit';
    transaction1.accountNumber = 'NLINGB987654321';
    transaction1.category = savedCategory;

    await transactionRepository.save(transaction1);

    // Second transaction with the same transactionId should throw an error
    const transaction2 = new Transaction();
    transaction2.transactionId = 'TXN00002';  // Same transactionId as transaction1
    transaction2.amount = 300.0;
    transaction2.timestamp = new Date();
    transaction2.description = 'Duplicate Transaction Test';
    transaction2.transactionType = 'credit';
    transaction2.accountNumber = 'NLINGB876543210';
    transaction2.category = savedCategory;

    // Expecting the save to throw a unique constraint violation error
    await expect(transactionRepository.insert(transaction2)).rejects.toThrow();
  });

  it('should delete a transaction', async () => {
    // First, create a category to assign to the transaction
    const category = new Category();
    category.name = 'Utilities';
    const savedCategory = await categoryRepository.save(category);

    // Create a transaction to be deleted
    const transaction = new Transaction();
    transaction.transactionId = 'TXN00003';
    transaction.amount = 300.0;
    transaction.timestamp = new Date();
    transaction.description = 'Test Transaction for Deletion';
    transaction.transactionType = 'credit';
    transaction.accountNumber = 'NLINGB765432109';
    transaction.category = savedCategory;

    const savedTransaction = await transactionRepository.save(transaction);

    // Now, delete the saved transaction
    await transactionRepository.delete(savedTransaction.transactionId);

    // Verify the transaction was deleted
    const foundTransaction = await transactionRepository.findOneBy({ transactionId: savedTransaction.transactionId });
    expect(foundTransaction).toBeNull();
  });
});
