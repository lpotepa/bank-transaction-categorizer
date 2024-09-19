import { exit } from 'process';
import { processCSVFile } from '../services/CSVtransactionProcessor';
import path from 'path';

const processTransactions = async () => {
  // Path to the CSV file
  const csvFilePath = path.join(__dirname, '../../data/02.transaction_history.csv');

  // Pass the file path to the service
  await processCSVFile(csvFilePath);
};

(async () => {
  await processTransactions();
  exit(0);
})();
