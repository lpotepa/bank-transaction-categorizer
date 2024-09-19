import { categorizeTransaction } from '../../services/categorizer';
import { AppDataSource } from '../../../ormconfig';
import { Transaction } from '../../models/Transaction';
import { Category } from '../../models/Category';
import { categorizeTransactions as categorizeWithOpenAI } from '../../services/openAiCategorizer';

jest.mock('../../../ormconfig');
jest.mock('../../services/openAiCategorizer'); // Mock OpenAI categorizer

describe('categorizeTransaction', () => {
  let transactionRepository: any;
  let categoryRepository: any;

  beforeAll(() => {
    transactionRepository = {
      findOne: jest.fn(),
    };
    categoryRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mocking AppDataSource.getRepository to return the mocked repositories
    AppDataSource.getRepository = jest.fn((model) => {
      if (model === Transaction) return transactionRepository;
      if (model === Category) return categoryRepository;
    });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it('should reuse an existing category if a transaction with the same description exists', async () => {
    // Mock existing transaction with category
    const mockCategory = { id: 1, name: 'Groceries' };
    const mockTransaction = { description: 'Test Transaction', category: mockCategory };

    transactionRepository.findOne.mockResolvedValue(mockTransaction);

    const result = await categorizeTransaction('Test Transaction');

    expect(transactionRepository.findOne).toHaveBeenCalledWith({
      where: { description: 'Test Transaction', category: { id: expect.anything() } },
      relations: ['category'],
    });
    expect(result).toEqual(mockCategory); // The same category should be reused
  });

  it('should categorize a transaction using OpenAI if no existing category is found', async () => {
    // Mock no existing transaction
    transactionRepository.findOne.mockResolvedValue(null);

    // Mock OpenAI categorization result
    const mockOpenAICategory = { category: { name: 'Utilities' } };
    (categorizeWithOpenAI as jest.Mock).mockResolvedValue([mockOpenAICategory]);

    // Mock category not found in the database, so it will create a new one
    categoryRepository.findOne.mockResolvedValue(null);
    categoryRepository.create.mockReturnValue(mockOpenAICategory.category);
    categoryRepository.save.mockResolvedValue(mockOpenAICategory.category);

    const result = await categorizeTransaction('New Transaction');

    expect(transactionRepository.findOne).toHaveBeenCalledWith({
      where: { description: 'New Transaction', category: { id: expect.anything() } },
      relations: ['category'],
    });
    expect(categorizeWithOpenAI).toHaveBeenCalledWith([{ description: 'New Transaction' }]);
    expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { name: 'Utilities' } });
    expect(categoryRepository.create).toHaveBeenCalledWith({ name: 'Utilities' });
    expect(categoryRepository.save).toHaveBeenCalledWith(mockOpenAICategory.category);
    expect(result).toEqual(mockOpenAICategory.category); // The new category should be returned
  });

  it('should reuse an existing OpenAI category if it already exists in the database', async () => {
    // Mock no existing transaction in the repository
    transactionRepository.findOne.mockResolvedValue(null);

    // Mock OpenAI categorization result
    const mockOpenAICategory = { category: { name: 'Entertainment' } };
    (categorizeWithOpenAI as jest.Mock).mockResolvedValue([mockOpenAICategory]);

    // Mock category already exists in the database
    const mockExistingCategory = { id: 2, name: 'Entertainment' };
    categoryRepository.findOne.mockResolvedValue(mockExistingCategory);

    const result = await categorizeTransaction('Some Description');

    expect(transactionRepository.findOne).toHaveBeenCalledWith({
      where: { description: 'Some Description', category: { id: expect.anything() } },
      relations: ['category'],
    });
    expect(categorizeWithOpenAI).toHaveBeenCalledWith([{ description: 'Some Description' }]);
    expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { name: 'Entertainment' } });
    expect(categoryRepository.save).not.toHaveBeenCalled(); // Should not save a new category
    expect(result).toEqual(mockExistingCategory); // Reuse the existing category
  });
});
