import { AppDataSource } from '../../ormconfig';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { categorizeTransactions as categorizeWithOpenAI } from './openAiCategorizer';
import { IsNull, Not } from 'typeorm';

export const categorizeTransaction = async (description: string) => {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const categoryRepository = AppDataSource.getRepository(Category);

    // Check if a category with this description already exists
    const existingTransaction = await transactionRepository.findOne({
        where: { description: description, category: { id: Not(IsNull()) } },
        relations: ['category'],
    });

    let category;

    if (existingTransaction) {
        // If a category with the same name exists, reuse it
        console.log(`Found existing category for description: ${description}`);
        category = existingTransaction.category;
    } else {
        // If no existing category, categorize using OpenAI
        console.log(`No existing category for description: ${description}. Categorizing with OpenAI...`);

        const categorizedTransactions = await categorizeWithOpenAI([{ description }]);

        const newCategoryName = categorizedTransactions[0].category.name;

        // Check if the OpenAI category already exists in the database
        let foundCategory = await categoryRepository.findOne({ where: { name: newCategoryName } });

        if (!foundCategory) {
            // If the category doesn't exist, create and save it
            foundCategory = categoryRepository.create({ name: newCategoryName });
            await categoryRepository.save(foundCategory);
        }
        category = foundCategory;
    }

    return category;
};
