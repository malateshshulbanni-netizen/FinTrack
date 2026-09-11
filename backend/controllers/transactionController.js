import Transaction from '../models/Transaction.js';
import Member from '../models/Member.js';
import { encryptAmount, decryptAmount } from '../utils/encryption.js';

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Public
export const createTransaction = async (req, res) => {
  try {
    const { memberId, type, category, amount, date, time } = req.body;

    // Validate
    if (!memberId || !type || !category || !amount || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Encrypt the amount using strong AES-256-GCM
    const encryptedAmount = encryptAmount(amount);

    // Create transaction with ONLY encrypted amount
    const transaction = await Transaction.create({
      memberId,
      memberName: member.name,
      type,
      category,
      amount: encryptedAmount, // Store encrypted in database ONLY
      date,
      time
    });

    // Decrypt amount for response
    const decryptedAmount = decryptAmount(transaction.amount);

    res.status(201).json({
      success: true,
      data: {
        ...transaction._doc,
        amount: decryptedAmount // Return decrypted amount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Public
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate('memberId', 'name status');

    // Decrypt amounts for response
    const decryptedTransactions = transactions.map(transaction => {
      const decryptedAmount = decryptAmount(transaction.amount);
      return {
        ...transaction._doc,
        amount: decryptedAmount !== null ? decryptedAmount : 0
      };
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: decryptedTransactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Public
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('memberId', 'name status');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Decrypt the amount
    const decryptedAmount = decryptAmount(transaction.amount);

    res.status(200).json({
      success: true,
      data: {
        ...transaction._doc,
        amount: decryptedAmount !== null ? decryptedAmount : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get transactions by member
// @route   GET /api/transactions/member/:memberId
// @access  Public
export const getTransactionsByMember = async (req, res) => {
  try {
    const transactions = await Transaction.find({ memberId: req.params.memberId })
      .sort({ createdAt: -1 });

    const decryptedTransactions = transactions.map(transaction => {
      const decryptedAmount = decryptAmount(transaction.amount);
      return {
        ...transaction._doc,
        amount: decryptedAmount !== null ? decryptedAmount : 0
      };
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: decryptedTransactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get transactions by type (income/expense)
// @route   GET /api/transactions/type/:type
// @access  Public
export const getTransactionsByType = async (req, res) => {
  try {
    const transactions = await Transaction.find({ type: req.params.type })
      .sort({ createdAt: -1 })
      .populate('memberId', 'name status');

    const decryptedTransactions = transactions.map(transaction => {
      const decryptedAmount = decryptAmount(transaction.amount);
      return {
        ...transaction._doc,
        amount: decryptedAmount !== null ? decryptedAmount : 0
      };
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: decryptedTransactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Public
export const updateTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, time } = req.body;

    let updateData = { type, category, date, time };

    // If amount is being updated, encrypt it
    if (amount) {
      updateData.amount = encryptAmount(amount);
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('memberId', 'name status');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Decrypt the amount
    const decryptedAmount = decryptAmount(transaction.amount);

    res.status(200).json({
      success: true,
      data: {
        ...transaction._doc,
        amount: decryptedAmount !== null ? decryptedAmount : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Public
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Public
export const getTransactionSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      // Decrypt the amount for calculations
      const decryptedAmount = decryptAmount(transaction.amount);
      const amount = decryptedAmount !== null ? decryptedAmount : 0;
      
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        totalTransactions: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};