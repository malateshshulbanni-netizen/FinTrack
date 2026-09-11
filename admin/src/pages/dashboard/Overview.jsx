import React, { useState, useEffect } from 'react';
import { 
  FaArrowUp, FaArrowDown, FaWallet, 
  FaMoneyBillWave, FaCreditCard, FaSpinner
} from 'react-icons/fa';
import { RefreshCw } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Overview = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch data', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data.data);
      toast.success('Data refreshed!', { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to refresh', { className: 'text-sm' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate real totals from ALL transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Total Profit = Income - Expense
  const totalProfit = totalIncome - totalExpense;

  // Calculate monthly change percentage
  const getMonthlyChange = (type) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthTotal = transactions
      .filter(t => {
        if (!t.date || t.type !== type) return false;
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const lastMonthTotal = transactions
      .filter(t => {
        if (!t.date || t.type !== type) return false;
        const date = new Date(t.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    if (lastMonthTotal === 0) return { change: '0%', positive: true };
    
    const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    return { 
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, 
      positive: change >= 0 
    };
  };

  // Calculate profit change
  const getProfitChange = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const getMonthProfit = (month, year) => {
      const monthIncome = transactions
        .filter(t => {
          if (!t.date || t.type !== 'income') return false;
          const date = new Date(t.date);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthExpense = transactions
        .filter(t => {
          if (!t.date || t.type !== 'expense') return false;
          const date = new Date(t.date);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return monthIncome - monthExpense;
    };

    const thisMonthProfit = getMonthProfit(currentMonth, currentYear);
    const lastMonthProfit = getMonthProfit(lastMonth, lastMonthYear);

    if (lastMonthProfit === 0) return { change: '0%', positive: true };
    
    const change = ((thisMonthProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
    return { 
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, 
      positive: change >= 0 
    };
  };

  const incomeChange = getMonthlyChange('income');
  const expenseChange = getMonthlyChange('expense');
  const profitChange = getProfitChange();

  // 3 Main Stats
  const stats = [
    { 
      title: 'Total Profit', 
      value: `₹${totalProfit.toLocaleString('en-IN')}`, 
      change: profitChange.change, 
      positive: profitChange.positive,
      icon: FaWallet,
      color: totalProfit >= 0 ? 'text-fintrack-green' : 'text-fintrack-expense'
    },
    { 
      title: 'Total Income', 
      value: `₹${totalIncome.toLocaleString('en-IN')}`, 
      change: incomeChange.change, 
      positive: incomeChange.positive,
      icon: FaMoneyBillWave,
      color: 'text-fintrack-income'
    },
    { 
      title: 'Total Expenses', 
      value: `₹${totalExpense.toLocaleString('en-IN')}`, 
      change: expenseChange.change, 
      positive: !expenseChange.positive,
      icon: FaCreditCard,
      color: 'text-fintrack-expense'
    },
  ];

  // Prepare cash flow data (last 7 months)
  const getCashFlowData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      const income = transactions
        .filter(t => {
          if (!t.date || t.type !== 'income') return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expenses = transactions
        .filter(t => {
          if (!t.date || t.type !== 'expense') return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      data.push({
        name: months[monthIndex],
        income,
        expenses
      });
    }

    return data;
  };

  // Prepare expense distribution data
  const getExpenseData = () => {
    const categoryMap = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + (t.amount || 0);
      });

    const data = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (data.length > 5) {
      const top5 = data.slice(0, 5);
      const others = data.slice(5).reduce((sum, item) => sum + item.value, 0);
      if (others > 0) {
        top5.push({ name: 'Others', value: others });
      }
      return top5;
    }

    return data;
  };

  // Get recent transactions (last 5)
  const getRecentTransactions = () => {
    return [...transactions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const cashFlowData = getCashFlowData();
  const expenseData = getExpenseData();
  const recentTransactions = getRecentTransactions();

  const COLORS = ['#0F9D68', '#087A50', '#16A34A', '#F59E0B', '#DC2626', '#6B7280'];

  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-fintrack-green text-4xl mx-auto mb-3" />
          <p className="text-sm text-fintrack-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-fintrack-navy">Overview</h2>
          <p className="text-xs sm:text-sm text-fintrack-secondary mt-1">
            Welcome back! Here's your financial summary
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors text-sm w-full sm:w-auto justify-center"
        >
          <RefreshCw 
            className={`w-4 h-4 transition-all duration-700 ${
              isRefreshing ? 'animate-spin text-fintrack-green' : 'text-fintrack-secondary'
            }`}
          />
          Refresh
        </button>
      </div>

      {/* 3 Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="stat-label">{stat.title}</p>
                <p className={`stat-value mt-1 text-lg sm:text-2xl truncate ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg bg-fintrack-light-green ${stat.color} flex-shrink-0`}>
                <stat.icon className="text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {stat.positive ? (
                <FaArrowUp className="text-fintrack-income text-xs" />
              ) : (
                <FaArrowDown className="text-fintrack-expense text-xs" />
              )}
              <span className={stat.positive ? 'stat-change-positive' : 'stat-change-negative'}>
                {stat.change}
              </span>
              <span className="text-xs text-fintrack-secondary">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cash Flow Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-fintrack-navy">Cash Flow</h3>
            <span className="text-xs text-fintrack-secondary">Last 7 months</span>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={11}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#16A34A" 
                  strokeWidth={2}
                  dot={{ fill: '#16A34A', r: 3 }}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                  dot={{ fill: '#DC2626', r: 3 }}
                  name="Expense"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-fintrack-navy">Expense Distribution</h3>
            <span className="text-xs text-fintrack-secondary">By category</span>
          </div>
          <div className="h-56 sm:h-64">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-fintrack-secondary">
                <p className="text-sm">No expense data</p>
              </div>
            )}
          </div>
          {expenseData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {expenseData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span className="text-fintrack-secondary">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-fintrack-navy">Recent Transactions</h3>
          <button 
            onClick={() => navigate('/dashboard/transactions')}
            className="text-xs sm:text-sm text-fintrack-green hover:text-fintrack-dark-green font-medium"
          >
            View All
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                    transaction.type === 'income' ? 'bg-fintrack-income' : 'bg-fintrack-expense'
                  }`}>
                    {transaction.memberName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fintrack-navy truncate">
                      {transaction.memberName}
                    </p>
                    <p className="text-xs text-fintrack-secondary truncate">
                      {transaction.category} • {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-fintrack-income' : 'text-fintrack-expense'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-fintrack-secondary capitalize">
                    {transaction.type}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-fintrack-secondary">
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-fintrack-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-fintrack-border last:border-0 hover:bg-fintrack-light-green transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                          transaction.type === 'income' ? 'bg-fintrack-income' : 'bg-fintrack-expense'
                        }`}>
                          {transaction.memberName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-fintrack-navy">
                          {transaction.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-fintrack-secondary">
                      {transaction.category}
                    </td>
                    <td className={`py-3 px-4 text-sm font-medium ${
                      transaction.type === 'income' ? 'text-fintrack-income' : 'text-fintrack-expense'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-fintrack-secondary">
                      {transaction.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full capitalize ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-fintrack-income' 
                          : 'bg-red-100 text-fintrack-expense'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-fintrack-secondary">
                    <p className="text-sm">No transactions yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;