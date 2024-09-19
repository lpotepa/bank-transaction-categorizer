import { Router } from 'express';
import { createTransaction, getAllTransactions, getTransactionById } from '../controllers/transactionsController';

const router = Router();

router.post('/transactions', createTransaction);
router.get('/transactions', getAllTransactions);
router.get('/transactions/:id', getTransactionById);

export default router;
