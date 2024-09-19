import { categorizeQueue } from './categorizeQueue';
import { categorizeTransaction } from '../services/categorizer';
import { AppDataSource } from '../../ormconfig';
import { Transaction } from '../models/Transaction';
import fs from 'fs';
import { processCSVFile } from '../services/CSVtransactionProcessor';

// Define job processing logic here
categorizeQueue.process(async (job: any) => {
  const { transactionId, description, filePath } = job.data;

  const transactionRepository = AppDataSource.getRepository(Transaction);

  // Add the CSV file processing logic (if filePath exists)
  if (filePath) {
    console.log(`Processing CSV file from within the queue: ${filePath}`);

    // Check if the file exists before processing
    if (fs.existsSync(filePath)) {
      console.log(`CSV file found: ${filePath}`);
      await processCSVFile(filePath); // Call the CSV processing service
      console.log(`CSV file processed successfully: ${filePath}`);

      // delete the file after processing
      fs.unlinkSync(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
    }

    return; // Exit after processing the CSV file
  }

  // Process a single transaction
  const transaction = await transactionRepository.findOneBy({ transactionId });

  if (transaction && !transaction.category) {
    let category = await categorizeTransaction(description);

    transaction.category = category;
    await transactionRepository.save(transaction);

    console.log(`Transaction ${transactionId} categorized with category: ${category.name}`);
  }
});
