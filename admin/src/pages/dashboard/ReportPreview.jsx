import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaDownload, FaSpinner, 
  FaArrowUp, FaArrowDown, FaWallet, FaFilePdf
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReportPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  
  // Get data from navigation state
  const { 
    memberId, 
    memberName, 
    timeFilter,
    from = 'analytics'
  } = location.state || { 
    memberId: 'all', 
    memberName: 'All Members',
    timeFilter: null,
    from: 'analytics'
  };
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/transactions`;
      if (memberId !== 'all') {
        url = `${API_URL}/api/transactions/member/${memberId}`;
      }
      
      const response = await axios.get(url);
      let data = response.data.data;
      
      // Apply time filter if provided
      if (timeFilter) {
        data = data.filter(t => {
          if (!t.date) return false;
          const date = new Date(t.date);
          
          // Year filter
          if (timeFilter.year && date.getFullYear() !== timeFilter.year) {
            return false;
          }
          
          // Month filter (0-11)
          if (timeFilter.month !== undefined && 
              timeFilter.month !== '' && 
              timeFilter.month !== null) {
            if (date.getMonth() !== timeFilter.month) return false;
          }
          
          // Week filter
          if (timeFilter.week) {
            const weekStart = new Date(timeFilter.week);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // Normalize times for comparison
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);
            
            const normalizedStart = new Date(weekStart);
            normalizedStart.setHours(0, 0, 0, 0);
            
            const normalizedEnd = new Date(weekEnd);
            normalizedEnd.setHours(23, 59, 59, 999);
            
            if (compareDate < normalizedStart || compareDate > normalizedEnd) {
              return false;
            }
          }
          
          return true;
        });
      }
      
      setTransactions(data);
      calculateSummary(data);
    } catch (error) {
      toast.error('Failed to fetch report data', { className: 'text-sm' });
    } finally {
      setLoading(false);
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

  const formatCurrency = (value) => {
    return `Rs. ${(value || 0).toLocaleString('en-IN')}`;
  };

  // Handle back button based on source
  const handleBack = () => {
    if (from === 'reports') {
      navigate('/dashboard/reports');
    } else if (from === 'analytics') {
      navigate('/dashboard/analytics');
    } else {
      navigate('/dashboard');
    }
  };

  const downloadPDF = () => {
    if (transactions.length === 0) {
      toast.warning('No transactions to download', { className: 'text-sm' });
      return;
    }

    setDownloading(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // ===== HEADER =====
      // Green brand bar
      pdf.setFillColor(15, 157, 104);
      pdf.rect(0, 0, pageWidth, 25, 'F');

      // Logo box
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, 6, 13, 13, 2, 2, 'F');
      pdf.setTextColor(15, 157, 104);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('F', 14.5, 15.5);

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FinTrack', 28, 13);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Financial Report', 28, 19);

      // Generated date (right side)
      const today = new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      pdf.setFontSize(9);
      pdf.text('Generated on', pageWidth - 12, 12, { align: 'right' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(today, pageWidth - 12, 18, { align: 'right' });

      // ===== REPORT INFO =====
      let yPos = 35;

      pdf.setFillColor(232, 247, 240);
      pdf.roundedRect(10, yPos, pageWidth - 20, 16, 2, 2, 'F');

      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Report for', 15, yPos + 6);

      pdf.setTextColor(23, 23, 23);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(memberName, 15, yPos + 12);

      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total ${summary.totalTransactions} transactions`, pageWidth - 15, yPos + 12, { align: 'right' });

      // ===== SUMMARY CARDS =====
      yPos += 24;
      const cardWidth = (pageWidth - 28) / 3;
      const cardHeight = 22;

      // Income Card
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Income', 15, yPos + 7);
      pdf.setTextColor(22, 163, 74);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(summary.totalIncome), 15, yPos + 16);

      // Expense Card
      const card2X = 10 + cardWidth + 4;
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(card2X, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Expenses', card2X + 5, yPos + 7);
      pdf.setTextColor(220, 38, 38);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(summary.totalExpense), card2X + 5, yPos + 16);

      // Profit Card
      const card3X = 10 + (cardWidth + 4) * 2;
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(card3X, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Profit', card3X + 5, yPos + 7);
      
      if (summary.profit >= 0) {
        pdf.setTextColor(15, 157, 104);
      } else {
        pdf.setTextColor(220, 38, 38);
      }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(summary.profit), card3X + 5, yPos + 16);

      // ===== TRANSACTIONS TABLE =====
      yPos += cardHeight + 10;

      // Section Title
      pdf.setTextColor(23, 23, 23);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transaction Details', 10, yPos);

      pdf.setDrawColor(15, 157, 104);
      pdf.setLineWidth(0.5);
      pdf.line(10, yPos + 2, pageWidth - 10, yPos + 2);

      yPos += 6;

      // Prepare table data
      const tableData = transactions.map((t, index) => [
        index + 1,
        t.date || '-',
        t.time || '-',
        t.memberName || '-',
        t.category || '-',
        t.type || '-',
        formatCurrency(t.amount)
      ]);

      // Use autoTable for reliable table generation
      autoTable(pdf, {
        startY: yPos,
        head: [['#', 'Date', 'Time', 'Member', 'Category', 'Type', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [232, 247, 240],
          textColor: [23, 23, 23],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [55, 65, 81],
          cellPadding: 1.5
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 14 },
          3: { cellWidth: 26 },
          4: { cellWidth: 26 },
          5: { cellWidth: 18 },
          6: { cellWidth: 28, halign: 'right' }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = pdf.internal.getNumberOfPages();
          const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
          
          pdf.setFontSize(8);
          pdf.setTextColor(107, 114, 128);
          pdf.setFont('helvetica', 'normal');
          
          // Left footer
          pdf.text(
            `FinTrack Financial Report - ${memberName}`, 
            10, 
            pageHeight - 8
          );
          
          // Right footer - page number
          pdf.text(
            `Page ${currentPage} of ${pageCount}`, 
            pageWidth - 10, 
            pageHeight - 8, 
            { align: 'right' }
          );
        }
      });

      // Save PDF
      const fileName = `FinTrack_Report_${memberName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully! 🎉', { className: 'text-sm' });
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF', { className: 'text-sm' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-fintrack-green text-4xl mx-auto mb-3" />
          <p className="text-sm text-fintrack-secondary">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-fintrack-light-green transition-colors"
          >
            <FaArrowLeft className="text-fintrack-secondary" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-fintrack-navy">Report Preview</h2>
            <p className="text-sm text-fintrack-secondary mt-1">
              {memberName} • {summary.totalTransactions} transactions
            </p>
          </div>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={downloading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            downloading 
              ? 'bg-fintrack-green/50 text-white/70 cursor-not-allowed' 
              : 'bg-fintrack-green text-white hover:bg-fintrack-dark-green'
          }`}
        >
          {downloading ? (
            <>
              <FaSpinner className="animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <FaDownload /> Download PDF
            </>
          )}
        </button>
      </div>

      {/* A4 Preview Container - Responsive */}
      <div className="flex justify-center overflow-x-auto py-4 sm:py-6 bg-gray-100 rounded-lg">
        <div 
          className="bg-white shadow-xl flex-shrink-0"
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm',
            transform: 'scale(1)',
            transformOrigin: 'top center'
          }}
        >
          {/* A4 Content */}
          <div>
            {/* Report Header */}
            <div className="border-b-2 border-fintrack-green pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-fintrack-green rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-fintrack-navy">FinTrack</h1>
                    <p className="text-xs text-fintrack-secondary">Financial Report</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-fintrack-secondary">Generated on</p>
                  <p className="text-sm font-medium text-fintrack-navy">
                    {new Date().toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Info */}
            <div className="mb-6">
              <div className="bg-fintrack-light-green rounded-lg p-4">
                <p className="text-xs text-fintrack-secondary mb-1">Report for</p>
                <p className="text-xl font-bold text-fintrack-navy">{memberName}</p>
                <p className="text-xs text-fintrack-secondary mt-1">
                  Total {summary.totalTransactions} transactions
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border border-fintrack-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaArrowUp className="text-fintrack-income text-sm" />
                  <p className="text-xs text-fintrack-secondary font-medium">Total Income</p>
                </div>
                <p className="text-lg font-bold text-fintrack-income">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <div className="border border-fintrack-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaArrowDown className="text-fintrack-expense text-sm" />
                  <p className="text-xs text-fintrack-secondary font-medium">Total Expenses</p>
                </div>
                <p className="text-lg font-bold text-fintrack-expense">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
              <div className="border border-fintrack-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaWallet className="text-fintrack-green text-sm" />
                  <p className="text-xs text-fintrack-secondary font-medium">Total Profit</p>
                </div>
                <p className={`text-lg font-bold ${summary.profit >= 0 ? 'text-fintrack-green' : 'text-fintrack-expense'}`}>
                  {formatCurrency(summary.profit)}
                </p>
              </div>
            </div>

            {/* All Transactions Table */}
            <div>
              <h3 className="text-sm font-bold text-fintrack-navy mb-3 pb-2 border-b border-fintrack-border">
                Transaction Details ({transactions.length} transactions)
              </h3>
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-fintrack-light-green">
                      <th className="text-center py-2 px-1 font-semibold text-fintrack-navy">#</th>
                      <th className="text-left py-2 px-1 font-semibold text-fintrack-navy">Date</th>
                      <th className="text-left py-2 px-1 font-semibold text-fintrack-navy">Time</th>
                      <th className="text-left py-2 px-1 font-semibold text-fintrack-navy">Member</th>
                      <th className="text-left py-2 px-1 font-semibold text-fintrack-navy">Category</th>
                      <th className="text-left py-2 px-1 font-semibold text-fintrack-navy">Type</th>
                      <th className="text-right py-2 px-1 font-semibold text-fintrack-navy">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map((t, index) => (
                        <tr 
                          key={t._id || index} 
                          className={`border-b border-fintrack-border ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="py-1.5 px-1 text-center text-fintrack-secondary">{index + 1}</td>
                          <td className="py-1.5 px-1 text-fintrack-secondary">{t.date}</td>
                          <td className="py-1.5 px-1 text-fintrack-secondary">{t.time}</td>
                          <td className="py-1.5 px-1 text-fintrack-navy font-medium truncate max-w-[80px]">{t.memberName}</td>
                          <td className="py-1.5 px-1 text-fintrack-secondary truncate max-w-[80px]">{t.category}</td>
                          <td className="py-1.5 px-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] ${
                              t.type === 'income' ? 'text-fintrack-income' : 'text-fintrack-expense'
                            }`}>
                              {t.type === 'income' ? (
                                <FaArrowUp className="text-[8px]" />
                              ) : (
                                <FaArrowDown className="text-[8px]" />
                              )}
                              {t.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 text-right text-fintrack-navy font-medium">
                            {formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-fintrack-secondary">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-fintrack-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFilePdf className="text-fintrack-green text-sm" />
                  <p className="text-xs text-fintrack-secondary">
                    FinTrack Financial Report - {memberName}
                  </p>
                </div>
                <p className="text-xs text-fintrack-secondary">
                  Total: {transactions.length} transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;