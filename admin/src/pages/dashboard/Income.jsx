import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSearch, FaFilter, FaTimes, 
  FaArrowUp, FaSpinner, FaWallet, 
  FaCalendarAlt, FaEye, FaTrash
} from 'react-icons/fa';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Income = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch income transactions
  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions/type/income`);
      setTransactions(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch income data', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/transactions/type/income`);
      setTransactions(response.data.data);
      setVisibleCount(10); // Reset visible count
      toast.success('Income refreshed!', { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to refresh', { className: 'text-sm' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await axios.delete(`${API_URL}/api/transactions/${id}`);
        setTransactions(transactions.filter(t => t._id !== id));
        toast.success('Income deleted successfully', { className: 'text-sm' });
      } catch (error) {
        toast.error('Failed to delete', { className: 'text-sm' });
      }
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterMember('');
    setSearchTerm('');
    setVisibleCount(10);
  };

  // Get unique categories and members
  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
  const uniqueMembers = [...new Set(transactions.map(t => t.memberName).filter(Boolean))];

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || t.category === filterCategory;
    const matchesMember = !filterMember || t.memberName === filterMember;
    
    return matchesSearch && matchesCategory && matchesMember;
  });

  // Get visible transactions (limited)
  const visibleTransactions = filteredTransactions.slice(0, visibleCount);
  const hasMore = filteredTransactions.length > visibleCount;
  const remainingCount = filteredTransactions.length - visibleCount;

  // Stats
  const totalIncome = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const averageIncome = transactions.length > 0 ? totalIncome / transactions.length : 0;
  const thisMonthIncome = transactions
    .filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = [
    { 
      label: 'Total Income', 
      value: `₹${totalIncome.toLocaleString('en-IN')}`, 
      icon: FaWallet, 
      color: 'text-fintrack-income' 
    },
    { 
      label: 'This Month', 
      value: `₹${thisMonthIncome.toLocaleString('en-IN')}`, 
      icon: FaCalendarAlt, 
      color: 'text-fintrack-green' 
    },
    { 
      label: 'Average', 
      value: `₹${Math.round(averageIncome).toLocaleString('en-IN')}`, 
      icon: FaArrowUp, 
      color: 'text-fintrack-green' 
    },
  ];

  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  const isFilterActive = filterCategory || filterMember;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Income</h2>
          <p className="text-sm text-fintrack-secondary mt-1">
            {transactions.length} income transactions
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className={`stat-value mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-fintrack-light-green">
                <stat.icon className={`text-xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fintrack-secondary" />
          <input
            type="text"
            placeholder="Search by member or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(10);
            }}
            className="w-full pl-10 pr-4 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
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

      {/* Filter Section */}
      {showFilters && (
        <div className="bg-gray-50 border border-fintrack-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-fintrack-navy">Filter Income</h4>
            <button
              onClick={clearFilters}
              className="text-xs text-fintrack-expense hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setVisibleCount(10);
                }}
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

            <div>
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Member
              </label>
              <select
                value={filterMember}
                onChange={(e) => {
                  setFilterMember(e.target.value);
                  setVisibleCount(10);
                }}
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
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-fintrack-green text-3xl mx-auto mb-2" />
            <p className="text-sm text-fintrack-secondary">Loading income...</p>
          </div>
        ) : visibleTransactions.length > 0 ? (
          <>
            {visibleTransactions.map((income) => (
              <div 
                key={income._id} 
                className="bg-white rounded-lg border border-fintrack-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fintrack-green rounded-full flex items-center justify-center text-white font-semibold">
                      {income.memberName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fintrack-navy">
                        {income.memberName}
                      </p>
                      <p className="text-xs text-fintrack-secondary">
                        {income.date} • {income.time}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-fintrack-income">
                    {income.category}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-fintrack-border">
                  <div className="flex items-center gap-2 text-fintrack-income">
                    <FaArrowUp className="text-sm" />
                    <span className="text-lg font-bold">
                      +{formatCurrency(income.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewDetails(income)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaEye className="text-fintrack-secondary text-sm" />
                    </button>
                    <button 
                      onClick={() => handleDelete(income._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash className="text-fintrack-secondary text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Show More Button - Mobile */}
            {hasMore && (
              <button
                onClick={handleShowMore}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors text-fintrack-green font-medium"
              >
                <ArrowDown className="w-4 h-4" />
                Show More ({remainingCount} remaining)
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-fintrack-border">
            <FaWallet className="mx-auto text-4xl text-fintrack-secondary/30 mb-3" />
            <p className="text-fintrack-secondary">No income found</p>
            <p className="text-sm text-fintrack-secondary mt-1">
              Income transactions will appear here
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-fintrack-green text-3xl mx-auto mb-2" />
              <p className="text-sm text-fintrack-secondary">Loading income...</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-fintrack-border bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Member</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-fintrack-secondary">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-fintrack-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.length > 0 ? (
                    visibleTransactions.map((income) => (
                      <tr key={income._id} className="border-b border-fintrack-border last:border-0 hover:bg-fintrack-light-green transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-fintrack-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {income.memberName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium text-fintrack-navy">
                              {income.memberName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-fintrack-income">
                            {income.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-fintrack-secondary">
                          {income.date}
                        </td>
                        <td className="py-3 px-4 text-sm text-fintrack-secondary">
                          {income.time}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1 text-fintrack-income font-semibold">
                            <FaArrowUp className="text-xs" />
                            {formatCurrency(income.amount)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleViewDetails(income)}
                              className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <FaEye className="text-fintrack-secondary hover:text-blue-600" />
                            </button>
                            <button 
                              onClick={() => handleDelete(income._id)}
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
                      <td colSpan="6" className="py-12 text-center">
                        <FaWallet className="mx-auto text-4xl text-fintrack-secondary/30 mb-3" />
                        <p className="text-fintrack-secondary">No income found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Show More Button - Desktop */}
              {hasMore && (
                <div className="p-4 border-t border-fintrack-border bg-gray-50">
                  <button
                    onClick={handleShowMore}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors text-fintrack-green font-medium text-sm"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Show More ({remainingCount} remaining)
                  </button>
                </div>
              )}
            </>
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
              <FaTimes className="w-5 h-5 text-fintrack-secondary" />
            </button>

            <div className="text-center mb-4">
              <div className="inline-block p-3 bg-green-50 rounded-full mb-3">
                <FaArrowUp className="text-fintrack-income text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-fintrack-navy">Income Details</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Member</span>
                <span className="text-sm font-medium text-fintrack-navy">
                  {selectedTransaction.memberName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Category</span>
                <span className="text-sm font-medium text-fintrack-navy">
                  {selectedTransaction.category}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Amount</span>
                <span className="text-lg font-bold text-fintrack-income">
                  {formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fintrack-border">
                <span className="text-sm text-fintrack-secondary">Date</span>
                <span className="text-sm font-medium text-fintrack-navy">
                  {selectedTransaction.date}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-fintrack-secondary">Time</span>
                <span className="text-sm font-medium text-fintrack-navy">
                  {selectedTransaction.time}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedTransaction(null);
              }}
              className="w-full mt-6 bg-fintrack-green text-white py-2.5 rounded-lg hover:bg-fintrack-dark-green transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;