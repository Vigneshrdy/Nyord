import { useEffect, useState } from 'react';
import { fixedDepositsAPI } from '../services/api';

const Dashboard = () => {
  const [fdSummary, setFdSummary] = useState({ totalInvestment: 0, totalMaturity: 0, count: 0, avgRate: 0 });

  useEffect(() => {
    (async () => {
      try {
        const fds = await fixedDepositsAPI.getMyFDs();
        const totalInvestment = fds.reduce((s, fd) => s + (fd.principal || 0), 0);
        const totalMaturity = fds.reduce((s, fd) => s + (fd.maturity_amount || 0), 0);
        const avgRate = fds.length ? (fds.reduce((s, fd) => s + (fd.rate || 0), 0) / fds.length) : 0;
        setFdSummary({ totalInvestment, totalMaturity, count: fds.length, avgRate });
      } catch (e) {
        // ignore if not logged in or no FDs
      }
    })();
  }, []);

  const accounts = [
    { name: 'Savings Account', number: '****4829', balance: 12450.00, type: 'savings' },
    { name: 'Current Account', number: '****8192', balance: 5820.50, type: 'current' },
    { name: 'Credit Card', number: '****3476', balance: -1250.00, type: 'credit' },
  ];

  const transactions = [
    { id: 1, name: 'Amazon Purchase', amount: -89.99, date: '2024-01-15', type: 'debit', category: 'Shopping' },
    { id: 2, name: 'Salary Deposit', amount: 5000.00, date: '2024-01-14', type: 'credit', category: 'Income' },
    { id: 3, name: 'Netflix Subscription', amount: -15.99, date: '2024-01-13', type: 'debit', category: 'Entertainment' },
    { id: 4, name: 'Grocery Store', amount: -125.50, date: '2024-01-12', type: 'debit', category: 'Food' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl opacity-80">account_balance_wallet</span>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">+12.5%</span>
            </div>
            <div className="text-sm opacity-90 mb-1">Total Balance</div>
            <div className="text-3xl font-bold">$18,270.50</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl text-green-500">trending_up</span>
              <span className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">+8.2%</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Income</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">$5,000.00</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl text-red-500">trending_down</span>
              <span className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full">-3.5%</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Expenses</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">$2,145.30</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Accounts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Accounts</h2>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View All</button>
              </div>
              
              <div className="space-y-4">
                {accounts.map((account, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        account.type === 'savings' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        account.type === 'current' ? 'bg-green-100 dark:bg-green-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <span className={`material-symbols-outlined ${
                          account.type === 'savings' ? 'text-blue-600 dark:text-blue-400' :
                          account.type === 'current' ? 'text-green-600 dark:text-green-400' :
                          'text-purple-600 dark:text-purple-400'
                        }`}>
                          {account.type === 'credit' ? 'credit_card' : 'account_balance'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{account.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{account.number}</div>
                      </div>
                    </div>
                    <div className={`text-xl font-bold ${account.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                      ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spending Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Monthly Spending</h2>
              <div className="space-y-4">
                {[
                  { category: 'Food & Dining', amount: 850, percentage: 40, color: 'bg-blue-500' },
                  { category: 'Shopping', amount: 620, percentage: 29, color: 'bg-purple-500' },
                  { category: 'Transportation', amount: 420, percentage: 20, color: 'bg-green-500' },
                  { category: 'Entertainment', amount: 255, percentage: 11, color: 'bg-yellow-500' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">${item.amount}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Dashboard;
