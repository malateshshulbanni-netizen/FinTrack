import React, { useState, useEffect } from 'react';
import { 
  FaFileInvoice, FaCalendarAlt, 
  FaUser, FaUsers, FaSpinner,
  FaChartLine, FaFileExport, FaClock,
  FaCalendarWeek, FaCalendarDay
} from 'react-icons/fa';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Reports = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Time filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

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
      setMembers(membersRes.data.data);
      setTransactions(transactionsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data', { className: 'text-sm' });
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
      setMembers(membersRes.data.data);
      setTransactions(transactionsRes.data.data);
      toast.success('Reports refreshed!', { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to refresh', { className: 'text-sm' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate report with proper time filter
  const generateReport = (memberId, memberName, timeFilter) => {
    navigate('/dashboard/report-preview', {
      state: {
        memberId,
        memberName,
        timeFilter: timeFilter || null,
        from: 'reports' // ← ADDED: Tells ReportPreview to go back to Reports
      }
    });
  };

  // Get available years from transactions
  const getAvailableYears = () => {
    const years = [...new Set(transactions.map(t => {
      if (!t.date) return null;
      return new Date(t.date).getFullYear();
    }).filter(Boolean))].sort((a, b) => b - a);
    
    return years.length > 0 ? years : [new Date().getFullYear()];
  };

  // Overall stats
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-fintrack-green text-4xl mx-auto mb-3" />
          <p className="text-sm text-fintrack-secondary">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Reports</h2>
          <p className="text-sm text-fintrack-secondary mt-1">
            Generate financial reports for members
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Members</p>
              <p className="stat-value mt-1 text-fintrack-green">{members.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-fintrack-light-green">
              <FaUsers className="text-fintrack-green text-xl" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Income</p>
              <p className="stat-value mt-1 text-fintrack-income truncate">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <FaChartLine className="text-fintrack-income text-xl" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Expenses</p>
              <p className="stat-value mt-1 text-fintrack-expense truncate">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <FaFileInvoice className="text-fintrack-expense text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* All Members Report Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-fintrack-green rounded-xl flex items-center justify-center flex-shrink-0">
              <FaUsers className="text-white text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-fintrack-navy">All Members Report</h3>
              <p className="text-sm text-fintrack-secondary mt-1">
                Generate complete report with all {transactions.length} transactions
              </p>
            </div>
          </div>
          <button 
            onClick={() => generateReport('all', 'All Members', null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-fintrack-green text-white rounded-lg hover:bg-fintrack-dark-green transition-colors text-sm w-full sm:w-auto justify-center font-medium"
          >
            <FaFileExport /> Generate Report
          </button>
        </div>
      </div>

      {/* Time Period Reports Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaCalendarAlt className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fintrack-navy">Time Period Reports</h3>
            <p className="text-xs text-fintrack-secondary">Generate reports for specific time periods</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Yearly Report Card */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-fintrack-border">
              <div className="w-12 h-12 bg-fintrack-green rounded-full flex items-center justify-center flex-shrink-0">
                <FaCalendarAlt className="text-white text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-fintrack-navy">Yearly Report</h4>
                <p className="text-xs text-fintrack-secondary">Full year summary</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
              >
                {getAvailableYears().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                const yearTx = transactions.filter(t => {
                  if (!t.date) return false;
                  return new Date(t.date).getFullYear() === selectedYear;
                });
                if (yearTx.length === 0) {
                  toast.warning('No transactions found for this year', { className: 'text-sm' });
                  return;
                }
                generateReport('all', `Yearly Report - ${selectedYear}`, {
                  year: selectedYear
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-fintrack-green text-fintrack-green rounded-lg hover:bg-fintrack-light-green transition-colors text-sm font-medium"
            >
              <FaFileExport className="text-sm" /> Generate Report
            </button>
          </div>

          {/* Monthly Report Card */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-fintrack-border">
              <div className="w-12 h-12 bg-fintrack-green rounded-full flex items-center justify-center flex-shrink-0">
                <FaCalendarDay className="text-white text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-fintrack-navy">Monthly Report</h4>
                <p className="text-xs text-fintrack-secondary">Month-wise summary</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
                >
                  {getAvailableYears().map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
                >
                  <option value="">All Months</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => {
                const monthTx = transactions.filter(t => {
                  if (!t.date) return false;
                  const date = new Date(t.date);
                  const yearMatch = date.getFullYear() === selectedYear;
                  const monthMatch = selectedMonth === '' || date.getMonth() === selectedMonth;
                  return yearMatch && monthMatch;
                });
                if (monthTx.length === 0) {
                  toast.warning('No transactions found for this period', { className: 'text-sm' });
                  return;
                }
                const monthName = selectedMonth !== '' 
                  ? months.find(m => m.value === selectedMonth)?.label 
                  : 'All Months';
                generateReport('all', `Monthly Report - ${monthName} ${selectedYear}`, {
                  year: selectedYear,
                  month: selectedMonth
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-fintrack-green text-fintrack-green rounded-lg hover:bg-fintrack-light-green transition-colors text-sm font-medium"
            >
              <FaFileExport className="text-sm" /> Generate Report
            </button>
          </div>

          {/* Weekly Report Card */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-fintrack-border">
              <div className="w-12 h-12 bg-fintrack-green rounded-full flex items-center justify-center flex-shrink-0">
                <FaCalendarWeek className="text-white text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-fintrack-navy">Weekly Report</h4>
                <p className="text-xs text-fintrack-secondary">Week-wise summary</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-fintrack-secondary mb-1.5">
                  Select Week Starting
                </label>
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green bg-white text-sm"
                />
              </div>
              <div className="p-2 bg-fintrack-light-green rounded-lg">
                <p className="text-xs text-fintrack-secondary">
                  <FaClock className="inline mr-1" />
                  7 days from selected date
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                if (!selectedWeek) {
                  toast.warning('Please select a week starting date', { className: 'text-sm' });
                  return;
                }
                const weekStart = new Date(selectedWeek);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const weekTx = transactions.filter(t => {
                  if (!t.date) return false;
                  const date = new Date(t.date);
                  return date >= weekStart && date <= weekEnd;
                });
                
                if (weekTx.length === 0) {
                  toast.warning('No transactions found for this week', { className: 'text-sm' });
                  return;
                }
                
                const weekLabel = `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                generateReport('all', `Weekly Report - ${weekLabel}`, {
                  week: selectedWeek
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-fintrack-green text-fintrack-green rounded-lg hover:bg-fintrack-light-green transition-colors text-sm font-medium"
            >
              <FaFileExport className="text-sm" /> Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Individual Member Reports */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-fintrack-light-green rounded-lg">
            <FaUser className="text-fintrack-green" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fintrack-navy">Individual Reports</h3>
            <p className="text-xs text-fintrack-secondary">Generate report for specific member</p>
          </div>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div 
                key={member._id} 
                className="card hover:shadow-md transition-shadow"
              >
                {/* Member Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-fintrack-green rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-fintrack-navy truncate">
                      {member.name}
                    </h4>
                    <p className="text-xs text-fintrack-secondary">
                      Member
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    member.status === 'Active' 
                      ? 'bg-green-100 text-fintrack-income' 
                      : 'bg-red-100 text-fintrack-expense'
                  }`}>
                    {member.status}
                  </span>
                </div>

                {/* Generate Button */}
                <button 
                  onClick={() => generateReport(member._id, member.name, null)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-fintrack-green text-fintrack-green rounded-lg hover:bg-fintrack-light-green transition-colors text-sm font-medium"
                >
                  <FaFileExport className="text-sm" /> Generate Report
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FaUsers className="mx-auto text-4xl text-fintrack-secondary/30 mb-3" />
            <p className="text-fintrack-secondary">No members found</p>
            <p className="text-sm text-fintrack-secondary mt-1">
              Add members to generate reports
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;