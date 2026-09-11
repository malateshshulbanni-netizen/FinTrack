import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaEye, FaTrash, 
  FaArrowUp, FaArrowDown, FaSpinner,
  FaFileExport, FaTimes
} from 'react-icons/fa';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMember, setFilterMember] = useState('');

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch transactions', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data.data);
      toast.success('Transactions refreshed!', { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to refresh transactions', { className: 'text-sm' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`${API_URL}/api/transactions/${id}`);
        setTransactions(transactions.filter(t => t._id !== id));
        toast.success('Transaction deleted successfully', { className: 'text-sm' });
      } catch (error) {
        toast.error('Failed to delete transaction', { className: 'text-sm' });
      }
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.warning('No transactions to export', { className: 'text-sm' });
      return;
    }

    const headers = ['Member', 'Category', 'Type', 'Amount', 'Date', 'Time'];
    const rows = transactions.map(t => [
      t.memberName || 'N/A',
      t.category || 'N/A',
      t.type || 'N/A',
      t.amount || 0,
      t.date || 'N/A',
      t.time || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully!', { className: 'text-sm' });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterMember('');
    setFilterType('all');
    setSearchTerm('');
  };

  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get unique categories and members for filter
  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
  const uniqueMembers = [...new Set(transactions.map(t => t.memberName).filter(Boolean))];

  // Filter transactions - auto applies
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = !filterCategory || transaction.category === filterCategory;
    const matchesMember = !filterMember || transaction.memberName === filterMember;
    
    return matchesSearch && matchesType && matchesCategory && matchesMember;
  });

  // Stats
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = [
    { label: 'Total Transactions', value: transactions.length, color: 'text-fintrack-green' },
    { label: 'Total Income', value: `₹${totalIncome.toLocaleString()}`, color: 'text-fintrack-income' },
    { label: 'Total Expenses', value: `₹${totalExpense.toLocaleString()}`, color: 'text-fintrack-expense' },
  ];

  // Check if any filter is active
  const isFilterActive = filterCategory || filterMember || filterType !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Transactions</h2>
          <p className="text-sm text-fintrack-secondary mt-1">View and manage all transactions</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors text-sm flex-1 sm:flex-none justify-center"
          >
            <FaFileExport /> Export CSV
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors text-sm flex-1 sm:flex-none justify-center"
          >
            <RefreshCw 
              className={`w-4 h-4 transition-all duration-700 ${
                isRefreshing ? 'animate-spin text-fintrack-green' : 'text-fintrack-secondary'
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className={`stat-value mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fintrack-secondary" />
          <input
            type="text"
            placeholder="Search transactions by member, category, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
          />
        </div>
        <button 
          onClick={toggleFilters}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || isFilterActive
              ? 'border-fintrack-green bg-fintrack-light-green text-fintrack-green' 
              : 'border-fintrack-border hover:bg-fintrack-light-green'
          }`}
        >
          <FaFilter /> Filter
          {isFilterActive && (
            <span className="w-2 h-2 bg-fintrack-green rounded-full"></span>
          )}
        </button>
      </div>

      {/* Filter Section - Below Search Bar */}
      {showFilters && (
        <div className="bg-gray-50 border border-fintrack-border rounded-lg p-4 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-fintrack-navy">Filter Transactions</h4>
            <button
              onClick={clearFilters}
              className="text-xs text-fintrack-expense hover:underline"
            >
              Clear All Filters
            </button>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Filter */}
            <div>
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Member
              </label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
              >
                <option value="">All Members</option>
                {uniqueMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {isFilterActive && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-fintrack-border">
              <span className="text-xs text-fintrack-secondary">Active:</span>
              {filterType !== 'all' && (
                <span className="text-xs px-2 py-1 bg-white rounded-full border border-fintrack-border">
                  Type: {filterType}
                </span>
              )}
              {filterCategory && (
                <span className="text-xs px-2 py-1 bg-white rounded-full border border-fintrack-border">
                  Category: {filterCategory}
                </span>
              )}
              {filterMember && (
                <span className="text-xs px-2 py-1 bg-white rounded-full border border-fintrack-border">
                  Member: {filterMember}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fintrack-green border-t-transparent"></div>
              <p className="text-sm text-fintrack-secondary mt-2">Loading transactions...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-fintrack-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-fintrack-secondary">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-fintrack-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-fintrack-border last:border-0 hover:bg-fintrack-light-green transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-fintrack-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {transaction.memberName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm font-medium text-fintrack-navy">{transaction.memberName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-fintrack-secondary hidden sm:table-cell">{transaction.category}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-fintrack-secondary inline-flex items-center gap-1">
                          {transaction.type === 'income' ? (
                            <FaArrowUp className="text-xs text-fintrack-income" />
                          ) : (
                            <FaArrowDown className="text-xs text-fintrack-expense" />
                          )}
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-fintrack-navy">
                        ₹{transaction.amount?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(transaction)}
                            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <FaEye className="text-fintrack-secondary hover:text-blue-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(transaction._id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="text-fintrack-secondary hover:text-fintrack-expense" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-fintrack-secondary">
                      <p>No transactions found</p>
                      <p className="text-sm mt-1">Add your first transaction to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedTransaction(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl text-fintrack-secondary hover:text-fintrack-navy">×</span>
            </button>

            <h3 className="text-xl font-bold text-fintrack-navy mb-4">Transaction Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Member</span>
                <span className="text-sm font-medium text-fintrack-navy">{selectedTransaction.memberName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Type</span>
                <span className="text-sm font-medium text-fintrack-navy">{selectedTransaction.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Category</span>
                <span className="text-sm font-medium text-fintrack-navy">{selectedTransaction.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Amount</span>
                <span className="text-lg font-bold text-fintrack-navy">
                  ₹{selectedTransaction.amount?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Date</span>
                <span className="text-sm font-medium text-fintrack-navy">{selectedTransaction.date}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-fintrack-secondary">Time</span>
                <span className="text-sm font-medium text-fintrack-navy">{selectedTransaction.time}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTransaction(null);
                }}
                className="w-full bg-fintrack-green text-white py-2.5 rounded-lg hover:bg-fintrack-dark-green transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;