import { AppDataSource } from '../../ormconfig';
import { Transaction } from '../models/Transaction';
import { categorizeTransaction } from './categorizer';
import fs from 'fs';
import csvParser from 'csv-parser';

export const processCSVFile = async (csvFilePath: string): Promise<void> => {
  console.log('Initializing database connection...');
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Database connection established.');
    } catch (error) {
      console.error('Error initializing database connection:', error);
      return;
    }
  } else {
    console.log('Database connection already initialized.');
  }

  const transactionRepository = AppDataSource.getRepository(Transaction);

  console.log('Database connection established.');

  try {
    // Parse the CSV file
    const transactions = await new Promise<any[]>((resolve, reject) => {
      const transactionList: any[] = [];

      console.log('Reading CSV file...');

      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          const transaction = {
            transactionId: row['Transaction ID'],
            amount: parseFloat(row['Amount']),
            timestamp: new Date(row['Timestamp']),
            description: row['Description'],
            transactionType: row['Transaction Type'],
            accountNumber: row['Account Number'],
          };
          transactionList.push(transaction);
        })
        .on('end', () => resolve(transactionList))
        .on('error', (error) => reject(error));
    });

    console.log(`CSV file successfully processed. Total transactions: ${transactions.length}`);

    if (transactions.length === 0) {
      console.error('No transactions found. Please check the CSV format or file content.');
      return;
    }

    const transactionsByDescription: { [key: string]: any[] } = {};

    // Group transactions by description
    transactions.forEach((transaction) => {
      const { description } = transaction;
      if (!transactionsByDescription[description]) {
        transactionsByDescription[description] = [];
      }
      transactionsByDescription[description].push(transaction);
    });

    // Process transactions by description group
    for (const description in transactionsByDescription) {
      const groupedTransactions = transactionsByDescription[description];

      // Categorize transactions based on the description
      const category = await categorizeTransaction(description);

      // Assign the category to each transaction in this group and save them
      for (const transactionData of groupedTransactions) {
        const transaction = transactionRepository.create({
          ...transactionData,
          category,
        });
        await transactionRepository.save(transaction);
      }
    }

    console.log('All transactions processed and categorized.');
  } catch (error) {
    console.error('Error processing CSV file:', error);
  }
};
