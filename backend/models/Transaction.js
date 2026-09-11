import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Please select a member']
  },
  memberName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please select transaction type']
  },
  category: {
    type: String,
    required: [true, 'Please select a category']
  },
  amount: {
    type: String, // Stored as encrypted string ONLY
    required: [true, 'Please enter an amount']
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;