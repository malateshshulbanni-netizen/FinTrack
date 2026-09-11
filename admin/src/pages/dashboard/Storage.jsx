import React, { useState, useEffect } from 'react';
import { 
  FaDatabase, FaUsers, FaList, FaFileInvoice, 
  FaWallet, FaCreditCard, FaHdd, FaSpinner,
  FaUserCheck, FaCheckCircle
} from 'react-icons/fa';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Storage = () => {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/members`),
        axios.get(`${API_URL}/api/transactions`)
      ]);
      setMembers(membersRes.data.data || []);
      setTransactions(transactionsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch storage data', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [membersRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/members`),
        axios.get(`${API_URL}/api/transactions`)
      ]);
      setMembers(membersRes.data.data || []);
      setTransactions(transactionsRes.data.data || []);
      toast.success('Storage data refreshed!', { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to refresh', { className: 'text-sm' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate stats
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const inactiveMembers = members.filter(m => m.status === 'Inactive').length;
  const incomeTransactions = transactions.filter(t => t.type === 'income').length;
  const expenseTransactions = transactions.filter(t => t.type === 'expense').length;

  const totalRecords = members.length + transactions.length;

  // Estimate storage usage (approximate calculation)
  // Each member doc: ~150 bytes
  // Each transaction doc: ~300 bytes (with encrypted amount)
  const membersSizeBytes = members.length * 150;
  const transactionsSizeBytes = transactions.length * 300;
  const totalSizeBytes = membersSizeBytes + transactionsSizeBytes;

  // Convert to readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // MongoDB Atlas Free Tier: 512 MB
  const MONGO_FREE_TIER_MB = 512;
  const MONGO_FREE_TIER_BYTES = MONGO_FREE_TIER_MB * 1024 * 1024;

  const usedBytes = totalSizeBytes;
  const totalBytes = MONGO_FREE_TIER_BYTES;
  const usagePercentage = Math.min((usedBytes / totalBytes) * 100, 100);

  // Storage breakdown
  const storageItems = [
    {
      title: 'Members',
      count: members.length,
      size: membersSizeBytes,
      icon: FaUsers,
      color: 'text-fintrack-green',
      bgColor: 'bg-fintrack-light-green',
    },
    {
      title: 'Transactions',
      count: transactions.length,
      size: transactionsSizeBytes,
      icon: FaList,
      color: 'text-fintrack-green',
      bgColor: 'bg-fintrack-light-green',
    },
    {
      title: 'Income Records',
      count: incomeTransactions,
      size: incomeTransactions * 300,
      icon: FaWallet,
      color: 'text-fintrack-income',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Expense Records',
      count: expenseTransactions,
      size: expenseTransactions * 300,
      icon: FaCreditCard,
      color: 'text-fintrack-expense',
      bgColor: 'bg-red-50',
    },
  ];

  // Summary stats
  const stats = [
    {
      label: 'Total Records',
      value: totalRecords,
      icon: FaDatabase,
      color: 'text-fintrack-green'
    },
    {
      label: 'Active Members',
      value: activeMembers,
      icon: FaUserCheck,
      color: 'text-fintrack-income'
    },
    {
      label: 'Inactive Members',
      value: inactiveMembers,
      icon: FaUsers,
      color: 'text-fintrack-expense'
    }
  ];

  // Get usage color based on percentage
  const getUsageColor = () => {
    if (usagePercentage < 50) return 'bg-fintrack-green';
    if (usagePercentage < 80) return 'bg-fintrack-warning';
    return 'bg-fintrack-expense';
  };

  const getUsageTextColor = () => {
    if (usagePercentage < 50) return 'text-fintrack-green';
    if (usagePercentage < 80) return 'text-fintrack-warning';
    return 'text-fintrack-expense';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-fintrack-green text-4xl mx-auto mb-3" />
          <p className="text-sm text-fintrack-secondary">Loading storage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Storage</h2>
          <p className="text-sm text-fintrack-secondary mt-1">
            MongoDB Atlas storage usage and statistics
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

      {/* Summary Stats */}
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

      {/* MongoDB Storage Usage Bar */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-fintrack-green rounded-xl flex items-center justify-center flex-shrink-0">
            <FaDatabase className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-bold text-fintrack-navy">MongoDB Storage</h3>
                <p className="text-xs text-fintrack-secondary mt-0.5">
                  Free Tier • {MONGO_FREE_TIER_MB} MB limit
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getUsageTextColor()}`}>
                  {usagePercentage.toFixed(2)}%
                </p>
                <p className="text-xs text-fintrack-secondary">
                  {formatBytes(usedBytes)} of {formatBytes(totalBytes)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-fintrack-secondary">
              Storage Used
            </span>
            <span className="text-xs font-medium text-fintrack-secondary">
              {formatBytes(totalBytes - usedBytes)} available
            </span>
          </div>
          
          {/* Bar Container */}
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getUsageColor()} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.max(usagePercentage, 0.5)}%` }}
            />
          </div>
          
          {/* Segments Legend */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-fintrack-secondary">
              <span className="w-2 h-2 rounded-full bg-fintrack-green"></span>
              Used: {formatBytes(usedBytes)}
            </div>
            <div className="flex items-center gap-2 text-xs text-fintrack-secondary">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              Free: {formatBytes(totalBytes - usedBytes)}
            </div>
          </div>
        </div>

        {/* Storage Breakdown Bars */}
        <div className="space-y-3 pt-4 border-t border-fintrack-border">
          <p className="text-xs font-medium text-fintrack-secondary mb-3">
            Storage Breakdown
          </p>
          
          {storageItems.map((item, index) => {
            const itemPercentage = usedBytes > 0 
              ? (item.size / usedBytes) * 100 
              : 0;
            
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <item.icon className={`text-xs ${item.color}`} />
                    <span className="text-xs font-medium text-fintrack-navy">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-fintrack-secondary">
                      {item.count} records
                    </span>
                    <span className="text-xs font-semibold text-fintrack-navy min-w-[60px] text-right">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getUsageColor()} opacity-70 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(itemPercentage, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Storage */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fintrack-light-green rounded-lg">
              <FaUsers className="text-fintrack-green" />
            </div>
            <div>
              <h3 className="font-semibold text-fintrack-navy">Members Storage</h3>
              <p className="text-xs text-fintrack-secondary">All member records</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-green"></div>
                <span className="text-sm text-fintrack-navy">Total Members</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fintrack-secondary">
                  {formatBytes(membersSizeBytes)}
                </span>
                <span className="text-sm font-semibold text-fintrack-navy">
                  {members.length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-income"></div>
                <span className="text-sm text-fintrack-navy">Active</span>
              </div>
              <span className="text-sm font-semibold text-fintrack-income">
                {activeMembers}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-expense"></div>
                <span className="text-sm text-fintrack-navy">Inactive</span>
              </div>
              <span className="text-sm font-semibold text-fintrack-expense">
                {inactiveMembers}
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Storage */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fintrack-light-green rounded-lg">
              <FaList className="text-fintrack-green" />
            </div>
            <div>
              <h3 className="font-semibold text-fintrack-navy">Transactions Storage</h3>
              <p className="text-xs text-fintrack-secondary">All transaction records</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-green"></div>
                <span className="text-sm text-fintrack-navy">Total Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fintrack-secondary">
                  {formatBytes(transactionsSizeBytes)}
                </span>
                <span className="text-sm font-semibold text-fintrack-navy">
                  {transactions.length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-income"></div>
                <span className="text-sm text-fintrack-navy">Income Records</span>
              </div>
              <span className="text-sm font-semibold text-fintrack-income">
                {incomeTransactions}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fintrack-expense"></div>
                <span className="text-sm text-fintrack-navy">Expense Records</span>
              </div>
              <span className="text-sm font-semibold text-fintrack-expense">
                {expenseTransactions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Info Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaHdd className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="font-semibold text-fintrack-navy">Storage Information</h3>
            <p className="text-xs text-fintrack-secondary">Database connection details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Database</p>
            <p className="text-sm font-medium text-fintrack-navy">MongoDB Atlas</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Plan</p>
            <p className="text-sm font-medium text-fintrack-navy">Free Tier (512 MB)</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Backend</p>
            <p className="text-sm font-medium text-fintrack-navy">Vercel Serverless</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Security</p>
            <p className="text-sm font-medium text-fintrack-navy">AES-256 Encrypted</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Total Records</p>
            <p className="text-sm font-medium text-fintrack-navy">{totalRecords}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-fintrack-secondary mb-1">Status</p>
            <p className="text-sm font-medium text-fintrack-income flex items-center gap-2">
              <FaCheckCircle className="text-xs" />
              Connected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Storage;