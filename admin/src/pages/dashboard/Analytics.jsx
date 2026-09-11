import React, { useState, useEffect } from 'react';
import { 
  FaChartBar, FaChartPie, FaChartLine, 
  FaArrowUp, FaArrowDown, FaWallet,
  FaSpinner, FaFileExport, FaTimes, FaUserCheck, FaUsers
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Analytics = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState('all');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    totalTransactions: 0
  });

  // Fetch data
  useEffect(() => {
    fetchData();
    fetchMembers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      const data = response.data.data;
      setTransactions(data);
      calculateSummary(data);
    } catch (error) {
      toast.error('Failed to fetch analytics data', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/members`);
      setMembers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch members');
    }
  };

  const calculateSummary = (data) => {
    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount || 0;
      } else {
        totalExpense += t.amount || 0;
      }
    });

    setSummary({
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      totalTransactions: data.length
    });
  };

  // Prepare monthly trends data
  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map(month => ({
      name: month,
      income: 0,
      expense: 0
    }));

    transactions.forEach(t => {
      if (!t.date) return;
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (t.type === 'income') {
          monthlyData[monthIndex].income += t.amount || 0;
        } else {
          monthlyData[monthIndex].expense += t.amount || 0;
        }
      }
    });

    return monthlyData;
  };

  // Prepare category distribution data
  const getCategoryDistribution = () => {
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

    if (data.length > 6) {
      const top6 = data.slice(0, 6);
      const others = data.slice(6).reduce((sum, item) => sum + item.value, 0);
      if (others > 0) {
        top6.push({ name: 'Others', value: others });
      }
      return top6;
    }

    return data;
  };

  // Prepare income vs expense comparison
  const getIncomeVsExpense = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const data = months.map(month => ({
      name: month,
      income: 0,
      expense: 0,
      savings: 0
    }));

    transactions.forEach(t => {
      if (!t.date) return;
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (t.type === 'income') {
          data[monthIndex].income += t.amount || 0;
        } else {
          data[monthIndex].expense += t.amount || 0;
        }
      }
    });

    data.forEach(item => {
      item.savings = item.income - item.expense;
    });

    return data;
  };

  // Get top spending categories
  const getTopCategories = () => {
    const categoryMap = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        if (!categoryMap[category]) {
          categoryMap[category] = { count: 0, total: 0 };
        }
        categoryMap[category].count += 1;
        categoryMap[category].total += t.amount || 0;
      });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        total: data.total,
        average: data.total / data.count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // Handle export report
  const handleExportReport = () => {
    navigate('/dashboard/report-preview', {
      state: {
        memberId: selectedMember,
        memberName: selectedMember === 'all' 
          ? 'All Members' 
          : members.find(m => m._id === selectedMember)?.name || 'Unknown',
        from: 'analytics' // ← ADDED: Tells ReportPreview to go back to Analytics
      }
    });
    setShowExportModal(false);
  };

  const monthlyTrends = getMonthlyTrends();
  const categoryDistribution = getCategoryDistribution();
  const incomeVsExpense = getIncomeVsExpense();
  const topCategories = getTopCategories();

  const COLORS = ['#0F9D68', '#16A34A', '#087A50', '#F59E0B', '#DC2626', '#6B7280', '#3B82F6'];

  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-fintrack-green text-4xl mx-auto mb-3" />
          <p className="text-sm text-fintrack-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Analytics</h2>
          <p className="text-sm text-fintrack-secondary mt-1">Insights from your financial data</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fintrack-green text-white rounded-lg text-sm hover:bg-fintrack-dark-green transition-colors"
        >
          <FaFileExport /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Income</p>
              <p className="stat-value mt-1 text-fintrack-income">
                {formatFullCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <FaArrowUp className="text-fintrack-income text-xl" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Expenses</p>
              <p className="stat-value mt-1 text-fintrack-expense">
                {formatFullCurrency(summary.totalExpense)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <FaArrowDown className="text-fintrack-expense text-xl" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Profit</p>
              <p className={`stat-value mt-1 ${summary.profit >= 0 ? 'text-fintrack-green' : 'text-fintrack-expense'}`}>
                {formatFullCurrency(summary.profit)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-fintrack-light-green">
              <FaWallet className="text-fintrack-green text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaChartLine className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="font-semibold text-fintrack-navy">Monthly Trends</h3>
            <p className="text-xs text-fintrack-secondary">Income vs Expenses over the year</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value) => formatFullCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#16A34A" 
                strokeWidth={2}
                dot={{ fill: '#16A34A', r: 3 }}
                activeDot={{ r: 5 }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#DC2626" 
                strokeWidth={2}
                dot={{ fill: '#DC2626', r: 3 }}
                activeDot={{ r: 5 }}
                name="Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fintrack-light-green rounded-lg">
              <FaChartPie className="text-fintrack-green" />
            </div>
            <div>
              <h3 className="font-semibold text-fintrack-navy">Expense Distribution</h3>
              <p className="text-xs text-fintrack-secondary">Where your money goes</p>
            </div>
          </div>
          <div className="h-80">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatFullCurrency(value)}
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
                <p>No expense data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fintrack-light-green rounded-lg">
              <FaChartBar className="text-fintrack-green" />
            </div>
            <div>
              <h3 className="font-semibold text-fintrack-navy">Income vs Expenses</h3>
              <p className="text-xs text-fintrack-secondary">Monthly comparison</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value) => formatFullCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#16A34A" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#DC2626" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Spending Categories */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaChartPie className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="font-semibold text-fintrack-navy">Top Spending Categories</h3>
            <p className="text-xs text-fintrack-secondary">Your highest expense categories</p>
          </div>
        </div>
        <div className="space-y-3">
          {topCategories.length > 0 ? (
            topCategories.map((category, index) => {
              const percentage = (category.total / summary.totalExpense) * 100;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fintrack-navy truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-fintrack-secondary">
                        {category.count} transactions • Avg {formatCurrency(category.average)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-fintrack-navy">
                      {formatFullCurrency(category.total)}
                    </p>
                    <p className="text-xs text-fintrack-secondary">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-fintrack-secondary">
              <p>No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Savings Growth */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaChartLine className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="font-semibold text-fintrack-navy">Savings Growth</h3>
            <p className="text-xs text-fintrack-secondary">Monthly savings trend</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value) => formatFullCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="savings" 
                name="Savings"
                radius={[4, 4, 0, 0]}
              >
                {incomeVsExpense.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.savings >= 0 ? '#0F9D68' : '#DC2626'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="w-5 h-5 text-fintrack-secondary" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-fintrack-light-green rounded-full mb-3">
                <FaFileExport className="text-fintrack-green text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-fintrack-navy">Export Report</h3>
              <p className="text-sm text-fintrack-secondary mt-1">Select a member to generate report</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fintrack-secondary mb-2">
                  Select Member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white"
                >
                  <option value="all">All Members</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleExportReport}
                  className="flex-1 bg-fintrack-green text-white py-2.5 rounded-lg hover:bg-fintrack-dark-green transition-colors flex items-center justify-center gap-2"
                >
                  <FaFileExport /> Generate Report
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 border border-fintrack-border py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;