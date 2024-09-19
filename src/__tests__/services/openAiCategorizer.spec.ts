import { OpenAICategorizer } from '../../services/openAiCategorizer';
import { AppDataSource } from '../../../ormconfig';
import { Category } from '../../models/Category';
import { ChatOpenAI } from '@langchain/openai';

jest.mock('@langchain/openai');
jest.mock('../../../ormconfig', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('OpenAICategorizer', () => {
  let openAICategorizer: OpenAICategorizer;
  let mockCategoryRepository: any;
  let mockStructuredLlm: any;

  beforeEach(() => {
    mockCategoryRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockCategoryRepository);

    mockStructuredLlm = {
      invoke: jest.fn(),
    };
    (ChatOpenAI as jest.MockedClass<typeof ChatOpenAI>).mockImplementation((): any => ({
      withStructuredOutput: jest.fn().mockReturnValue(mockStructuredLlm),
    }));

    openAICategorizer = new OpenAICategorizer('fake-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load OPENAI_API_KEY from .env.test', () => {
    expect(process.env.OPENAI_API_KEY).toBe('testkey'); // Ensure it's the value from .env.test
  });

  it('should create a new category if it does not exist', async () => {
    mockStructuredLlm.invoke.mockResolvedValue({ category: 'NewCategory' });
    mockCategoryRepository.findOneBy.mockResolvedValue(null);

    const createdCategory = new Category();
    createdCategory.id = 1;
    createdCategory.name = 'NewCategory';
    mockCategoryRepository.create.mockReturnValue(createdCategory);
    mockCategoryRepository.save.mockResolvedValue(createdCategory);

    const result = await openAICategorizer.categorizeTransactions([{ description: 'New transaction' }]);

    expect(mockStructuredLlm.invoke).toHaveBeenCalledWith('Categorize this transaction description: "New transaction"');
    expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ name: 'NewCategory' });
    expect(mockCategoryRepository.create).toHaveBeenCalledWith({ name: 'NewCategory' });
    expect(mockCategoryRepository.save).toHaveBeenCalledWith(createdCategory);
    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual(createdCategory);
  });

  it('should reuse existing category if it exists', async () => {
    mockStructuredLlm.invoke.mockResolvedValue({ category: 'ExistingCategory' });

    const existingCategory = new Category();
    existingCategory.id = 2;
    existingCategory.name = 'ExistingCategory';
    mockCategoryRepository.findOneBy.mockResolvedValue(existingCategory);

    const result = await openAICategorizer.categorizeTransactions([{ description: 'Existing transaction' }]);

    expect(mockStructuredLlm.invoke).toHaveBeenCalledWith('Categorize this transaction description: "Existing transaction"');
    expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ name: 'ExistingCategory' });
    expect(mockCategoryRepository.create).not.toHaveBeenCalled();
    expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual(existingCategory);
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockStructuredLlm.invoke.mockRejectedValue(new Error('API Error'));

    const result = await openAICategorizer.categorizeTransactions([{ description: 'Error transaction' }]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });
});