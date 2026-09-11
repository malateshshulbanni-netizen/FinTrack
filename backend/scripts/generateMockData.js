import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';
import Transaction from '../models/Transaction.js';
import { encryptAmount } from '../utils/encryption.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Categories for income
const incomeCategories = [
  'Salary', 'Freelance', 'Investment', 'Agriculture', 'Bank Interest', 'Other'
];

// Categories for expense
const expenseCategories = [
  'Food', 'Rent', 'Transport', 'Shopping', 'Bills', 
  'Entertainment', 'Education', 'Healthcare', 'Other'
];

// Random number between min and max
const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Random amount based on category type
const getRandomAmount = (type, category) => {
  if (type === 'income') {
    switch(category) {
      case 'Salary':
        return randomBetween(25000, 60000);
      case 'Freelance':
        return randomBetween(5000, 25000);
      case 'Investment':
        return randomBetween(1000, 15000);
      case 'Agriculture':
        return randomBetween(2000, 20000);
      case 'Bank Interest':
        return randomBetween(500, 5000);
      default:
        return randomBetween(1000, 10000);
    }
  } else {
    switch(category) {
      case 'Rent':
        return randomBetween(8000, 15000);
      case 'Food':
        return randomBetween(200, 1500);
      case 'Transport':
        return randomBetween(100, 800);
      case 'Shopping':
        return randomBetween(500, 5000);
      case 'Bills':
        return randomBetween(500, 3000);
      case 'Entertainment':
        return randomBetween(200, 2000);
      case 'Education':
        return randomBetween(1000, 10000);
      case 'Healthcare':
        return randomBetween(300, 5000);
      default:
        return randomBetween(100, 2000);
    }
  }
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Format time to HH:MM
const formatTime = (date) => {
  return date.toTimeString().slice(0, 5);
};

// Generate transactions for one year
const generateTransactions = async (members) => {
  const transactions = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Loop through each day for one year
  let currentDate = new Date(oneYearAgo);
  
  while (currentDate <= today) {
    // For each member, generate 1-3 transactions per day
    for (const member of members) {
      const transactionsPerDay = randomBetween(1, 3);
      
      for (let i = 0; i < transactionsPerDay; i++) {
        // Randomly decide income or expense (70% expense, 30% income)
        const isIncome = Math.random() < 0.3;
        const type = isIncome ? 'income' : 'expense';
        const categories = isIncome ? incomeCategories : expenseCategories;
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Generate amount
        const amount = getRandomAmount(type, category);
        
        // Generate random time
        const randomHour = randomBetween(8, 22);
        const randomMinute = randomBetween(0, 59);
        const transactionDate = new Date(currentDate);
        transactionDate.setHours(randomHour, randomMinute, 0, 0);
        
        // Encrypt amount
        const encryptedAmount = encryptAmount(amount);
        
        transactions.push({
          memberId: member._id,
          memberName: member.name,
          type,
          category,
          amount: encryptedAmount,
          date: formatDate(currentDate),
          time: formatTime(transactionDate),
          createdAt: transactionDate
        });
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return transactions;
};

// Main function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('📊 Starting mock data generation...');
    
    // Get all members
    const members = await Member.find();
    
    if (members.length === 0) {
      console.log('❌ No members found. Please add members first.');
      process.exit(1);
    }
    
    console.log(`👥 Found ${members.length} members`);
    
    // Optional: Clear existing transactions
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('🗑️  Clearing existing transactions...');
      await Transaction.deleteMany({});
      console.log('✅ Existing transactions cleared');
    }
    
    // Generate transactions
    console.log('⏳ Generating 1 year of transactions...');
    const transactions = await generateTransactions(members);
    
    console.log(`📝 Generated ${transactions.length} transactions`);
    
    // Insert in batches to avoid memory issues
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await Transaction.insertMany(batch);
      inserted += batch.length;
      console.log(`📦 Inserted ${inserted}/${transactions.length} transactions`);
    }
    
    console.log('✅ Mock data generation complete!');
    console.log(`📊 Total transactions: ${transactions.length}`);
    
    // Show summary
    const totalIncome = transactions.filter(t => t.type === 'income').length;
    const totalExpense = transactions.filter(t => t.type === 'expense').length;
    
    console.log('\n📈 Summary:');
    console.log(`   Income transactions: ${totalIncome}`);
    console.log(`   Expense transactions: ${totalExpense}`);
    console.log(`   Date range: ${formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)))} to ${formatDate(new Date())}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();