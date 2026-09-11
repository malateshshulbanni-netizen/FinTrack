import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getTransactionsByMember,
  getTransactionsByType,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} from '../controllers/transactionController.js';

const router = express.Router();

// GET all transactions
router.get('/', getTransactions);

// GET transaction summary
router.get('/summary', getTransactionSummary);

// GET transactions by type
router.get('/type/:type', getTransactionsByType);

// GET transactions by member
router.get('/member/:memberId', getTransactionsByMember);

// GET single transaction
router.get('/:id', getTransaction);

// POST create transaction
router.post('/', createTransaction);

// PUT update transaction
router.put('/:id', updateTransaction);

// DELETE transaction
router.delete('/:id', deleteTransaction);

export default router;