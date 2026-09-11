import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  FaUser, FaMoneyBillWave, FaCalendarAlt, FaClock, 
  FaPaperPlane, FaSpinner, FaArrowUp, FaArrowDown,
  FaTags, FaUserCheck, FaPlus, FaTimes
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TransactionForm = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'income',
    category: '',
    amount: '',
    date: '',
    time: ''
  });

  // Fetch members on load
  useEffect(() => {
    fetchMembers();
    setCurrentDateTime();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Using the new /active endpoint to get only active members
      const response = await axios.get(`${API_URL}/api/members/active`);
      setMembers(response.data.data);
      // REMOVED: Auto-select first member
      // if (response.data.data.length > 0) {
      //   setFormData(prev => ({ ...prev, memberId: response.data.data[0]._id }));
      // }
    } catch (error) {
      toast.error('Failed to fetch members', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, date, time }));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, type });
  };

  const handleCategorySelect = (category) => {
    if (category === 'Other') {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: '' });
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      setFormData({ ...formData, category });
    }
  };

  const handleCustomCategorySubmit = () => {
    if (!customCategory.trim()) {
      toast.warning('Please enter a category name', { className: 'text-sm' });
      return;
    }
    setFormData({ ...formData, category: customCategory.trim() });
    setShowCustomCategory(false);
    toast.success(`Category "${customCategory.trim()}" added!`, { className: 'text-sm' });
  };

  const handleCustomCategoryClose = () => {
    setShowCustomCategory(false);
    setCustomCategory('');
    // Reset to first category if "Other" was selected
    if (formData.category === '') {
      setFormData({ ...formData, category: categories[0] });
    }
  };

  // Reset form function
  const resetForm = () => {
    // Keep the selected member
    const currentMemberId = formData.memberId;
    
    setFormData({
      memberId: currentMemberId,
      type: 'income',
      category: '',
      amount: '',
      date: '',
      time: ''
    });
    setCurrentDateTime();
    setCustomCategory('');
    setShowCustomCategory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.memberId) {
      toast.warning('Please select a member', { className: 'text-sm' });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.warning('Please enter a valid amount', { className: 'text-sm' });
      return;
    }
    if (!formData.category) {
      toast.warning('Please select a category', { className: 'text-sm' });
      return;
    }

    setSubmitting(true);

    try {
      const transactionData = {
        memberId: formData.memberId,
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        time: formData.time
      };

      // Send to backend API with encryption
      const response = await axios.post(`${API_URL}/api/transactions`, transactionData);
      
      if (response.data.success) {
        toast.success('Transaction submitted successfully! 🎉', { className: 'text-sm' });
        
        // Reset form
        resetForm();
        
        // Auto refresh page after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit transaction', { className: 'text-sm' });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'Food', 'Rent', 'Transport', 'Shopping', 'Bills', 
    'Entertainment', 'Education', 'Healthcare', 'Salary', 
    'Freelance', 'Investment', 'Agriculture', 'Bank Interest', 'Other'
  ];

  const transactionTypes = [
    { value: 'income', label: 'Income', icon: FaArrowUp, color: 'text-fintrack-income' },
    { value: 'expense', label: 'Expense', icon: FaArrowDown, color: 'text-fintrack-expense' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-fintrack-light-green rounded-full mb-3">
            <FaMoneyBillWave className="text-fintrack-green text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-fintrack-navy">New Transaction</h1>
          <p className="text-sm text-fintrack-secondary mt-1">Record your income or expense</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-fintrack-secondary mb-2">
              <FaUserCheck className="inline mr-2" />
              Select Member
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-fintrack-secondary">
                <FaSpinner className="animate-spin" />
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="text-fintrack-secondary text-sm p-3 bg-gray-50 rounded-lg border border-fintrack-border">
                No active members found. Please add members first.
              </div>
            ) : (
              <select
                name="memberId"
                value={formData.memberId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white"
              >
                <option value="">Select Member</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transaction Type - Small Buttons */}
          <div>
            <label className="block text-sm font-medium text-fintrack-secondary mb-2">
              <FaTags className="inline mr-2" />
              Transaction Type
            </label>
            <div className="flex gap-3">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                    formData.type === type.value
                      ? type.value === 'income'
                        ? 'border-fintrack-income bg-green-50 text-fintrack-income'
                        : 'border-fintrack-expense bg-red-50 text-fintrack-expense'
                      : 'border-fintrack-border hover:bg-gray-50 text-fintrack-secondary'
                  }`}
                >
                  <type.icon className="text-sm" />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category - Small Buttons */}
          <div>
            <label className="block text-sm font-medium text-fintrack-secondary mb-2">
              <FaTags className="inline mr-2" />
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    formData.category === cat
                      ? 'bg-fintrack-green text-white'
                      : cat === 'Other'
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-fintrack-secondary hover:bg-gray-200'
                  }`}
                >
                  {cat === 'Other' ? (
                    <span className="flex items-center gap-1">
                      <FaPlus className="text-xs" />
                      Other
                    </span>
                  ) : (
                    cat
                  )}
                </button>
              ))}
            </div>
            {/* Show selected custom category */}
            {formData.category && !categories.includes(formData.category) && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-fintrack-green/10 text-fintrack-green rounded-full text-sm">
                <span>Custom: {formData.category}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, category: '' });
                    setShowCustomCategory(true);
                  }}
                  className="hover:bg-fintrack-green/20 rounded-full p-0.5"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
          </div>

          {/* Custom Category Popup Modal */}
          {showCustomCategory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                  onClick={handleCustomCategoryClose}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-fintrack-secondary hover:text-fintrack-navy" />
                </button>

                <div className="text-center mb-4">
                  <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
                    <FaTags className="text-purple-600 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-fintrack-navy">Custom Category</h3>
                  <p className="text-sm text-fintrack-secondary mt-1">Enter your custom category name</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-fintrack-secondary mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g., Groceries, Utilities, etc."
                      className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomCategorySubmit();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCustomCategorySubmit}
                      className="flex-1 bg-fintrack-green text-white py-2.5 rounded-lg hover:bg-fintrack-dark-green transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPlus className="text-sm" />
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomCategoryClose}
                      className="flex-1 border border-fintrack-border py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-fintrack-secondary mb-2">
              <FaMoneyBillWave className="inline mr-2" />
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
              step="0.01"
              min="0"
            />
          </div>

          {/* Date and Time - Read Only / Locked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fintrack-secondary mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  readOnly
                  className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg bg-gray-100 text-fintrack-secondary cursor-not-allowed"
                />
                <div className="absolute inset-0 bg-transparent cursor-not-allowed"></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-fintrack-secondary mb-2">
                <FaClock className="inline mr-2" />
                Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  readOnly
                  className="w-full px-4 py-2.5 border border-fintrack-border rounded-lg bg-gray-100 text-fintrack-secondary cursor-not-allowed"
                />
                <div className="absolute inset-0 bg-transparent cursor-not-allowed"></div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || members.length === 0}
            className={`w-full py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              submitting || members.length === 0
                ? 'bg-fintrack-green/50 text-white/70 cursor-not-allowed'
                : 'bg-fintrack-green text-white hover:bg-fintrack-dark-green'
            }`}
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4" />
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Submit Transaction
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-fintrack-secondary">
          <span className="inline-block w-2 h-2 bg-fintrack-green rounded-full mr-1"></span>
          All transactions are secure and encrypted
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;