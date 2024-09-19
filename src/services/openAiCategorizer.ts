import { AppDataSource } from '../../ormconfig';
import { Category } from '../models/Category';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { CATEGORIES } from '../constants';

export class OpenAICategorizer {
  private model: ChatOpenAI;
  private structuredLlm: any;
  private categoryRepository: any;

  constructor(openAIApiKey: string) {
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: openAIApiKey,
    });

    const categoriesSchema = z.object({
      transaction_id: z.string(),
      category: z.enum(CATEGORIES),
    });

    this.structuredLlm = this.model.withStructuredOutput(categoriesSchema);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async categorizeTransactions(transactions: any[]): Promise<{ category: Category }[]> {
    const categorizedResults: { category: Category }[] = [];

    for (const transaction of transactions) {
      const { description } = transaction;
      const query = `Categorize this transaction description: "${description}"`;

      try {
        const result = await this.structuredLlm.invoke(query);
        const categoryName = result.category;

        let category = await this.categoryRepository.findOneBy({ name: categoryName });

        if (!category) {
          category = this.categoryRepository.create({ name: categoryName });
          await this.categoryRepository.save(category);
        }

        categorizedResults.push({
          category,
        });
      } catch (error) {
        console.error(`Error categorizing transaction with description ${description}:`, error);
      }
    }

    return categorizedResults;
  }
}

export const createOpenAICategorizer = (openAIApiKey: string) => {
  return new OpenAICategorizer(openAIApiKey);
};

export const categorizeTransactions = (transactions: any[]) => {
  const openAICategorizer = createOpenAICategorizer(process.env.OPENAI_API_KEY!);
  return openAICategorizer.categorizeTransactions(transactions);
};
