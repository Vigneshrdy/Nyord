import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  MoreHorizontal,
  Calendar,
  Send,
  Download,
  Wallet,
  Building,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleSettings = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getSummary();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data when user is available
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const totalIncome = dashboardData?.monthly_income || 0.00;
  const totalExpenses = dashboardData?.monthly_expenses || 0.00;
  const cardBalance = dashboardData?.total_balance || 0.00;
  const currentNetWorth = (dashboardData?.total_balance || 0) - (dashboardData?.loans?.total_outstanding || 0);
  const incomeChange = dashboardData?.income_change_percent || 0;
  const expenseChange = dashboardData?.expense_change_percent || 0;

  // Transform recent transactions from API
  const recentTransactions = dashboardData?.recent_transactions?.map(txn => ({
    id: txn.id,
    date: new Date(txn.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    description: txn.description || (txn.type === 'credit' ? 'Received' : 'Sent'),
    account: txn.type === 'credit' ? 
      `From: ${txn.src_account_number || 'Unknown'}` : 
      `To: ${txn.dest_account_number || 'Unknown'}`,
    amount: txn.type === 'credit' ? txn.amount : -txn.amount,
    type: txn.type,
    userName: txn.type === 'credit' ? txn.src_user_name : txn.dest_user_name
  })) || [
    // Fallback mock data if no API data
    {
      id: 1,
      date: 'Feb 3, 2025, 06:30 AM',
      description: 'Salary',
      account: 'Bank 94711',
      amount: 3000.00,
      type: 'credit'
    },
    {
      id: 2,
      date: 'Feb 4, 2025, 08:45 PM',
      description: 'Netflix',
      account: 'Netflix Billing',
      amount: -15.99,
      type: 'debit'
    },
    {
      id: 3,
      date: 'Feb 3, 2025, 11:30 AM',
      description: 'John Doe',
      account: 'Bank 94710',
      amount: 4500.00,
      type: 'credit'
    },
    {
      id: 4,
      date: 'Feb 1, 2025, 07:45 AM',
      description: 'Maria Garcia',
      account: 'Bank 94712',
      amount: 3700.00,
      type: 'credit'
    }
  ];

  const quickTransferContacts = [
    { name: 'Alex', avatar: '👤', color: 'bg-red-500' },
    { name: 'Sarah', avatar: '👤', color: 'bg-green-500' },
    { name: 'Mike', avatar: '👤', color: 'bg-blue-500' },
    { name: 'Emma', avatar: '👤', color: 'bg-yellow-500' },
    { name: 'John', avatar: '👤', color: 'bg-purple-500' },
    { name: 'Lisa', avatar: '👤', color: 'bg-pink-500' }
  ];

  const spendingData = [40, 60, 45, 80, 100, 65, 75]; // Weekly spending data

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.username?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Effortlessly manage your finances with real-time insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:from-teal-600 hover:to-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Card Overview</h2>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Effortlessly track your card balance and recent transactions
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Main Balance</p>
                  <p className="text-xs text-gray-400">Dec 2024</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    ${cardBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-teal-600 font-medium">
                    {dashboardData?.balance_change_percent > 0 ? '+' : ''}
                    {dashboardData?.balance_change_percent?.toFixed(2) || '0.00'}% from last month
                  </p>
                </div>
              </div>
              
              {/* Quick Transfer Panel removed from here; moved to sidebar */}
            </div>

            {/* Investment Performance */}
            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Net Worth</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${currentNetWorth.toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  FD Investments: ${(dashboardData?.fixed_deposits?.total_investment || 0).toLocaleString()}
                </p>
              </div>
              
              {/* Performance Circle */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40 * (Math.abs(dashboardData?.balance_change_percent || 0) / 100)} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-teal-600">
                    {Math.abs(dashboardData?.balance_change_percent || 0).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transfer Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transfer Activity</h2>
              <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
                <option>February</option>
                <option>January</option>
                <option>December</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-b pb-2">
                <span className="w-32">Date & Time</span>
                <span className="flex-1">Description</span>
                <span className="w-24">Account</span>
                <span className="w-24 text-right">Amount</span>
              </div>
              
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="w-32 text-xs text-gray-500">{transaction.date}</span>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{transaction.description}</span>
                      {transaction.userName && (
                        <div className="text-xs text-gray-500">{transaction.userName}</div>
                      )}
                    </div>
                  </div>
                  <span className="w-24 text-sm text-gray-500">{transaction.account}</span>
                  <span className={`w-24 text-right font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <Download size={16} />
                Recent Transfer
              </button>
              <button 
                onClick={() => navigate('/statements')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View Full Transaction History →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Total Income/Expenses */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalIncome.toLocaleString()}</p>
                </div>
                <div className="text-teal-600">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className={`text-sm mt-2 ${incomeChange >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% Last Month
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toLocaleString()}</p>
                </div>
                <div className={totalExpenses > 0 ? "text-red-500" : "text-gray-400"}>
                  <TrendingDown size={24} />
                </div>
              </div>
              <p className={`text-sm mt-2 ${expenseChange <= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% Last Month
              </p>
            </div>
          </div>

          {/* Right sidebar quick transfer: moved here above Spending Overview */}

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Transfers</h3>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/transfer')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Send size={16} />
                Money Transfer
              </button>

              <button
                onClick={() => navigate('/qr-payment')}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Building size={16} />
                QR Transfer
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recent Transaction Users</p>
                    {recentTransactions && recentTransactions.length > 0 ? (
                      <div className="flex items-center gap-3">
                        {recentTransactions.slice(0, 5).map((t, idx) => (
                          <button
                            key={t.id || idx}
                            type="button"
                            onClick={() => navigate(`/transfer?recipient=${encodeURIComponent(t.userName || t.description || '')}`)}
                            className="flex flex-col items-center text-center focus:outline-none"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${idx % 2 === 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                              { (t.userName || t.description || 'U').toString().charAt(0).toUpperCase() }
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate w-20">{t.userName || t.description || 'Unknown'}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No recent transactions</div>
                    )}
            </div>
          </div>

          

            
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
