import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  FaHome, FaChartLine, FaWallet, FaCreditCard, 
  FaFileAlt, FaSignOutAlt,
  FaBell, FaSearch, FaBars, FaTimes,
  FaChevronLeft, FaChevronRight, FaUserPlus, FaList,
  FaFileInvoice, FaDatabase
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Overview from './dashboard/Overview';
import Analytics from './dashboard/Analytics';
import Income from './dashboard/Income';
import Expenses from './dashboard/Expenses';
import AddMembers from './dashboard/AddMembers';
import Transactions from './dashboard/Transactions';
import ReportPreview from './dashboard/ReportPreview';
import Reports from './dashboard/Reports';
import Storage from './dashboard/Storage';

const Dashboard = ({ setIsAuthenticated }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast.info('Logged out successfully', { className: 'text-sm' });
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/' },
    { icon: FaUserPlus, label: 'Add Members', path: '/add-members' },
    { icon: FaList, label: 'Transactions', path: '/transactions' },
    { icon: FaChartLine, label: 'Analytics', path: '/analytics' },
    { icon: FaWallet, label: 'Income', path: '/income' },
    { icon: FaCreditCard, label: 'Expenses', path: '/expenses' },
    { icon: FaFileInvoice, label: 'Reports', path: '/reports' },
    { icon: FaDatabase, label: 'Storage', path: '/storage' },
  ];

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-fintrack-border">
        {sidebarOpen || isMobile ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fintrack-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-fintrack-navy">FinTrack</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-fintrack-green rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">F</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-fintrack-light-green transition-colors"
        >
          {isMobile ? (
            <FaTimes className="text-fintrack-secondary" />
          ) : sidebarOpen ? (
            <FaChevronLeft className="text-fintrack-secondary" />
          ) : (
            <FaChevronRight className="text-fintrack-secondary" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={`/dashboard${item.path}`}
            onClick={closeMobileMenu}
            className={`sidebar-link ${(!sidebarOpen && !isMobile) && 'justify-center'}`}
          >
            <item.icon className="sidebar-icon" />
            {(sidebarOpen || isMobile) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-fintrack-border">
        <button
          onClick={() => {
            handleLogout();
            closeMobileMenu();
          }}
          className={`sidebar-link w-full ${(!sidebarOpen && !isMobile) && 'justify-center'}`}
        >
          <FaSignOutAlt className="sidebar-icon text-red-500" />
          {(sidebarOpen || isMobile) && <span className="text-red-500">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-fintrack-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-fintrack-border transition-all duration-300 flex flex-col flex-shrink-0 relative hidden md:flex`}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMobileMenu}
          />
          <div className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl transition-transform duration-300">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-fintrack-border px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-fintrack-light-green transition-colors md:hidden"
              >
                <FaBars className="text-fintrack-secondary text-xl" />
              </button>
            )}
            {/* Desktop Toggle Button */}
            {!isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-fintrack-light-green transition-colors hidden md:flex"
              >
                <FaChevronRight className="text-fintrack-secondary" />
              </button>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-fintrack-navy truncate">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 bg-fintrack-background px-3 py-1.5 rounded-lg border border-fintrack-border">
              <FaSearch className="text-fintrack-secondary text-sm" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-32 lg:w-48"
              />
            </div>
            
            <button className="p-2 rounded-lg hover:bg-fintrack-light-green transition-colors relative">
              <FaBell className="text-fintrack-secondary text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-fintrack-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              {!isMobile && sidebarOpen && (
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-fintrack-navy">Admin</p>
                  <p className="text-xs text-fintrack-secondary">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/add-members" element={<AddMembers />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/report-preview" element={<ReportPreview />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;