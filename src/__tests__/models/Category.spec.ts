import { AppDataSource } from '../../../ormconfig';
import { Category } from '../../models/Category';

describe('Category Model', () => {
  let categoryRepository: any;

  // Initialize the database connection before all tests
  beforeAll(async () => {
    await AppDataSource.initialize();
    categoryRepository = AppDataSource.getRepository(Category);
  });

  // Clear the categories table after each test to ensure isolation
  afterEach(async () => {
    await categoryRepository.query('TRUNCATE TABLE "category" RESTART IDENTITY CASCADE');
  });

  // Close the database connection after all tests are done
  afterAll(async () => {    
    await AppDataSource.destroy();
  });

  it('should create a new category', async () => {
    const category = new Category();
    category.name = 'Utilities';

    const savedCategory = await categoryRepository.save(category);

    expect(savedCategory).toBeDefined();
    expect(savedCategory.id).toBeDefined();
    expect(savedCategory.name).toBe('Utilities');
  });

  it('should not allow duplicate category names', async () => {
    // First category with name 'Groceries'
    const category1 = new Category();
    category1.name = 'Groceries';
    await categoryRepository.save(category1);

    // Second category with the same name should throw an error
    const category2 = new Category();
    category2.name = 'Groceries';

    // Expecting the save to throw a unique constraint violation
    await expect(categoryRepository.save(category2)).rejects.toThrow();
  });

  it('should delete a category', async () => {
    const category = new Category();
    category.name = 'Utilities';
    const savedCategory = await categoryRepository.save(category);

    // Delete the saved category
    await categoryRepository.delete(savedCategory.id);

    // Verify the category was deleted
    const foundCategory = await categoryRepository.findOneBy({ id: savedCategory.id });
    expect(foundCategory).toBeNull();
  });
});
