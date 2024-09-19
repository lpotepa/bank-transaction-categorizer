import { processCSVFile } from '../../services/CSVtransactionProcessor';
import { AppDataSource } from '../../../ormconfig';
import { Transaction } from '../../models/Transaction';
import { Category } from '../../models/Category';
import { categorizeTransaction } from '../../services/categorizer'; // Mock this

import path from 'path';

jest.mock('../../services/categorizer'); // Mock the categorizeTransaction function

describe('CSVTransactionProcessor with actual CSV and real categories', () => {
  let categoryRepository: any;
  let transactionRepository: any;

  beforeAll(async () => {
    // Initialize the real database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    categoryRepository = AppDataSource.getRepository(Category);
    transactionRepository = AppDataSource.getRepository(Transaction);

    // Pre-create categories to avoid mocking
    await categoryRepository.save([
      { name: 'Groceries' },
      { name: 'Utilities' },
      { name: 'Entertainment' },
      { name: 'Housing' }
    ]);
  });

  afterEach(async () => {
    // Clean up the database after each test
    await transactionRepository.query('TRUNCATE TABLE "category" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    // Close the database connection after all tests
    await AppDataSource.destroy();
  });

  it('should process a CSV file and save transactions with pre-created categories', async () => {
    // Mock categorizeTransaction to return a predefined category
    const mockCategory = await categoryRepository.findOne({ where: { name: 'Groceries' } });
    (categorizeTransaction as jest.Mock).mockResolvedValue(mockCategory);

    // Provide the path to the actual CSV file in the `fixtures` folder
    const csvFilePath = path.join(__dirname, '../fixtures/transactions.csv');

    // Run the CSV processor
    await processCSVFile(csvFilePath);

    // Fetch the saved transactions from the database
    const transactions = await transactionRepository.find({ relations: ['category'] });

    // Assert that the transactions were saved and categorized
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].category.name).toBe('Groceries');
  });

  it('should handle an empty CSV file and log an error', async () => {
    // Spy on console.error to capture error logs
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Provide the path to the empty CSV file
    const emptyCsvFilePath = path.join(__dirname, '../fixtures/empty.csv');

    // Run the CSV processor
    await processCSVFile(emptyCsvFilePath);

    // Assert that an error is logged for the empty file
    expect(consoleErrorSpy).toHaveBeenCalledWith('No transactions found. Please check the CSV format or file content.');

    // Ensure that no transactions were saved
    const transactions = await transactionRepository.find();
    expect(transactions.length).toBe(0);

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it('should handle errors during CSV file processing', async () => {
    // Spy on console.error to capture error logs
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Use a non-existent or incorrect CSV path to simulate an error
    const invalidCsvFilePath = path.join(__dirname, '../fixtures/invalid.csv');

    // Run the CSV processor and expect it to catch the error
    await processCSVFile(invalidCsvFilePath);

    // Assert that the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing CSV file:', expect.any(Error));

    // Clean up
    consoleErrorSpy.mockRestore();
  });
});
