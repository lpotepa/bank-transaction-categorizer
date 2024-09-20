import { Request, Response } from 'express';
import { AppDataSource } from '../../ormconfig';
import { Transaction } from '../models/Transaction';
import { categorizeQueue } from '../queue/categorizeQueue';
import multer from 'multer';
import path from 'path';
import { QueryFailedError } from 'typeorm';
import { ErrorCodes } from '../constants';
import { createTransactionSchema } from '../validators/transactionValidator';

const upload = multer({ dest: 'uploads/' }).single('file');

// POST /transactions: Submit a new transaction or upload a CSV file
export const createTransaction = async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Multer error during file upload.', error: err });
    } else if (err) {
      return res.status(500).json({ message: 'An unknown error occurred during file upload.', error: err });
    }

    if (req.file) {
      const csvFilePath = path.join(__dirname, '../../uploads', req.file.filename);
      categorizeQueue.add({ filePath: csvFilePath }, { attempts: 3} );
      return res.status(202).json({ message: 'CSV file received. Processing has been queued.' });
    }

    // Validate incoming data using Zod schema
    try {
      createTransactionSchema.parse(req.body);
    } catch (validationError: any) {
      return res.status(400).json({ message: 'Invalid data', error: validationError.errors });
    }

    const { transactionId, amount, timestamp, description, transactionType, accountNumber } = req.body;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const newTransaction = transactionRepository.create({
      transactionId,
      amount,
      timestamp,
      description,
      transactionType,
      accountNumber,
    });

    try {
      await transactionRepository.insert(newTransaction);
      categorizeQueue.add({ transactionId, description },  { attempts: 3 });
      return res.status(202).json(newTransaction);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === ErrorCodes.UNIQUE_VIOLATION) {
        return res.status(409).json({ message: `Transaction with ID ${transactionId} already exists.` });
      }
      return res.status(500).json({ message: 'Error saving transaction', error });
    }
  });
};

// GET /transactions: Retrieve all categorized transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  const transactions = await transactionRepository.find();
  return res.json(transactions);
};

// GET /transactions/:id: Retrieve a specific transaction by ID
export const getTransactionById = async (req: Request, res: Response) => {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  const transaction = await transactionRepository.findOneBy({ transactionId: req.params.id });

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  return res.json(transaction);
};