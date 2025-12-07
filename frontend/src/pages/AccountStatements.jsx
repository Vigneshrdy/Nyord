import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { transactionsAPI, accountsAPI, adminAPI } from '../services/api';

const AccountStatements = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [rawTransactions, setRawTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [txns, accs, usersData] = await Promise.all([
          transactionsAPI.getMyTransactions(),
          accountsAPI.getAccounts(),
          adminAPI.getAllUsers().catch(() => []) // Fallback if not admin
        ]);
        setRawTransactions(txns || []);
        setAccounts(accs || []);
        setUsers(usersData || []);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build account map for quick lookup
  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach(acc => {
      map[acc.id] = acc;
    });
    return map;
  }, [accounts]);

  // Build user map for quick lookup
  const userMap = useMemo(() => {
    const map = {};
    users.forEach(user => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const getStartDate = () => {
      switch (selectedPeriod) {
        case 'thisMonth':
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'lastMonth':
          return new Date(now.getFullYear(), now.getMonth() - 1, 1);
        case 'last3Months':
          return new Date(now.getFullYear(), now.getMonth() - 3, 1);
        case 'last6Months':
          return new Date(now.getFullYear(), now.getMonth() - 6, 1);
        case 'thisYear':
          return new Date(now.getFullYear(), 0, 1);
        default:
          return new Date(0); // all time
      }
    };

    const startDate = getStartDate();
    return rawTransactions.filter(txn => {
      const txnDate = new Date(txn.timestamp);
      return txnDate >= startDate;
    });
  }, [rawTransactions, selectedPeriod]);

  // Derive period start/end strings
  const periodRange = useMemo(() => {
    const now = new Date();
    let start;
    switch (selectedPeriod) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(0);
    }
    const end = now;
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(end) };
  }, [selectedPeriod]);

  // Compute summary stats
  const summary = useMemo(() => {
    if (!accounts.length || !filteredTransactions.length) {
      return { opening: 0, credits: 0, debits: 0, closing: 0 };
    }

    // For simplicity, use current total balance as closing
    const closing = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    let credits = 0;
    let debits = 0;

    filteredTransactions.forEach(txn => {
      const amount = txn.amount || 0;
      const isCredit = accounts.some(acc => acc.id === txn.dest_account);
      const isDebit = accounts.some(acc => acc.id === txn.src_account);

      // If both source and dest belong to user, it's an internal transfer (count as both)
      if (isCredit && !isDebit) {
        credits += amount;
      }
      if (isDebit && !isCredit) {
        debits += amount;
      }
    });

    const opening = closing - credits + debits;

    return { opening, credits, debits, closing };
  }, [accounts, filteredTransactions]);

  // Enrich transactions with type and balance (simplified running balance calculation)
  const enrichedTransactions = useMemo(() => {
    let runningBalance = summary.opening;
    return filteredTransactions.map(txn => {
      const isCredit = accounts.some(acc => acc.id === txn.dest_account);
      const isDebit = accounts.some(acc => acc.id === txn.src_account);
      
      let type = 'debit';
      let description = `Transfer`;
      
        if (isCredit && !isDebit) {
        type = 'credit';
        runningBalance += txn.amount || 0;
        const srcAcc = accountMap[txn.src_account];
        // Prefer server-provided username if available, otherwise fall back to userMap lookup
        let userName = txn.src_user_name || null;
        if (!userName) {
          const srcUser = srcAcc?.user_id ? userMap[srcAcc.user_id] : null;
          userName = srcUser?.full_name || srcUser?.username || 'Unknown User';
        }
        description = `Received from ${userName}`;
      } else if (isDebit && !isCredit) {
        type = 'debit';
        runningBalance -= txn.amount || 0;
        const destAcc = accountMap[txn.dest_account];
        // Prefer server-provided username if available, otherwise fall back to userMap lookup
        let userName = txn.dest_user_name || null;
        if (!userName) {
          const destUser = destAcc?.user_id ? userMap[destAcc.user_id] : null;
          userName = destUser?.full_name || destUser?.username || 'Unknown User';
        }
        description = `Sent to ${userName}`;
      } else {
        // Internal transfer
        type = 'transfer';
        description = 'Internal Transfer';
      }

      return {
        ...txn,
        type,
        description,
        balance: runningBalance,
        category: txn.status === 'SUCCESS' ? 'Transfer' : txn.status,
      };
    });
  }, [filteredTransactions, accounts, accountMap, userMap, summary.opening]);

  const displayTransactions = enrichedTransactions;

  const formatINR = (n) => `$ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 40;
    const line = (text = '', size = 12) => { doc.setFontSize(size); doc.text(String(text), 40, y); y += 18; };
    const sep = () => { line('-------------------------------------', 12); };
    const center = (text, size = 14) => {
      doc.setFontSize(size);
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
      y += 18;
    };

    // Header
    line('=============================', 12);
    center('NYORD BANK', 18);
    center('ACCOUNT STATEMENT', 16);
    line('=============================', 12);
    y += 4;
    line(`Generated On: ${new Date().toLocaleString()}`);
    y += 8;

    // Customer details
    sep();
    center('CUSTOMER DETAILS', 14); y += 4;
    sep();
    const primaryAcc = accounts[0];
    const name = 'Customer'; // Could be enhanced to fetch user profile name
    line(`Name: ${name}`);
    line(`Account Number: ${primaryAcc ? primaryAcc.account_number : '—'}`);
    line(`Account Type: ${primaryAcc ? (primaryAcc.account_type || '—') : '—'}`);
    line(`Statement Period: ${periodRange.start} to ${periodRange.end}`);
    y += 8;

    // Summary
    sep();
    center('SUMMARY', 14); y += 4;
    sep();
    line(`Opening Balance : ${formatINR(summary.opening)}`);
    line(`Total Credits   : ${formatINR(summary.credits)}`);
    line(`Total Debits    : ${formatINR(summary.debits)}`);
    line(`Closing Balance : ${formatINR(summary.closing)}`);
    y += 8;

    // Transaction history header
    sep();
    center('TRANSACTION HISTORY', 14); y += 4;
    sep();
    line('Date        | Description          | Type    | Amount   | Balance');
    line('--------------------------------------------------------------------');

    // Transactions rows (truncate if needed)
    displayTransactions.forEach(txn => {
      const date = new Date(txn.timestamp).toISOString().slice(0, 10);
      const desc = (txn.description || '').slice(0, 20).padEnd(20, ' ');
      const type = (txn.type || '').toUpperCase().padEnd(7, ' ');
      const amount = formatINR(Math.abs(txn.amount)).padStart(12, ' ');
      const bal = formatINR(txn.balance).padStart(12, ' ');
      line(`${date}  | ${desc} | ${type} | ${amount} | ${bal}`);
      if (y > 760) { doc.addPage(); y = 40; }
    });
    y += 8;

    // Notes
    sep();
    center('NOTES', 14); y += 4;
    sep();
    line('• This is a system-generated statement.');
    line('• For support, contact support@nyordbank.com.');
    y += 12;

    // Footer
    line('=============================', 12);
    center(`NYORD BANK • ${new Date().getFullYear()}`, 12);
    center('Secure • Smart • Seamless', 12);
    line('=============================', 12);

    doc.save('nyord-account-statement.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Statements</h1>
          <p className="text-gray-600 dark:text-gray-400">View and download your transaction history</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="last6Months">Last 6 Months</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>

            <div className="flex items-end">
              <button onClick={downloadPdf} className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
                <span className="material-symbols-outlined mr-2">download</span>
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</span>
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${summary.opening.toFixed(2)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Credits</span>
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">arrow_downward</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">+${summary.credits.toFixed(2)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Debits</span>
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">arrow_upward</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">-${summary.debits.toFixed(2)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Closing Balance</span>
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">account_balance_wallet</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${summary.closing.toFixed(2)}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading transactions...
                    </td>
                  </tr>
                ) : displayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No transactions found for this period.
                    </td>
                  </tr>
                ) : displayTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(txn.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          txn.type === 'credit' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <span className={`material-symbols-outlined text-sm ${
                            txn.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {txn.type === 'credit' ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {txn.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {txn.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                      txn.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {txn.type === 'credit' ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                      ${txn.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{displayTransactions.length}</span> transaction{displayTransactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Previous
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatements;
