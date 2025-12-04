import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationApiContext';

const LoanApprovalDashboard = () => {
  const { showSuccess, showError } = useNotifications();
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadPendingLoans();
  }, []);

  const loadPendingLoans = async () => {
    try {
      setLoading(true);
      const pending = await adminAPI.getPendingLoans();
      console.log('Pending loans data:', pending);
      
      // If user details are missing, try to fetch them
      const enrichedLoans = await Promise.all(
        pending.map(async (loan) => {
          if (!loan.user && loan.user_id) {
            try {
              const allUsers = await adminAPI.getAllUsers();
              const user = allUsers.find(u => u.id === loan.user_id);
              return { ...loan, user };
            } catch (error) {
              console.log('Could not fetch user details for loan:', loan.id);
              return loan;
            }
          }
          return loan;
        })
      );
      
      setPendingLoans(enrichedLoans);
    } catch (err) {
      setError('Failed to load pending loan applications');
      console.error('Error loading loan applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (loanId, approve) => {
    try {
      setActionLoading(loanId);
      
      const action = approve ? 'approve' : 'reject';
      const reason = approve ? 'Loan application meets all requirements' : 'Loan application does not meet requirements';
      
      await adminAPI.approveLoan(loanId, action, reason);
      
      // Remove from pending list
      setPendingLoans(prev => prev.filter(loan => loan.id !== loanId));
      
      // Show success message
      showSuccess(
        'Loan Application Updated',
        `Loan application has been ${action}d successfully!${approve ? ' The loan amount will be credited to the user\'s account.' : ''}`
      );
      
    } catch (err) {
      setError(`Failed to ${approve ? 'approve' : 'reject'} loan application`);
      console.error('Error updating loan application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateMonthlyPayment = (principal, rate, months) => {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return monthlyPayment;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading pending loan applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <span className="material-symbols-outlined mr-2">error</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Loan Approval Dashboard</h2>
            <p className="text-gray-600 mt-1">Review and approve pending loan applications</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-blue-600">trending_up</span>
            <span className="text-sm font-medium text-gray-700">
              {pendingLoans.length} Pending Application{pendingLoans.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {pendingLoans.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">trending_up</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Loan Applications</h3>
            <p className="text-gray-500">All loan applications have been processed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Applicant Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {loan.user?.username?.charAt(0)?.toUpperCase() || (loan.user?.full_name?.charAt(0)?.toUpperCase()) || loan.user_id?.toString().charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {loan.user?.username || loan.user?.full_name || `User ${loan.user_id || 'Unknown'}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {loan.user_id || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">User ID:</span>
                        <span className="font-medium">{loan.user_id || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Username:</span>
                        <span className="font-medium">{loan.user?.username || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{loan.user?.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{loan.user?.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Applied On:</span>
                        <span className="font-medium">{formatDate(loan.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-green-600">account_balance</span>
                      Loan Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Loan Amount</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(loan.principal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Interest Rate:</span>
                          <span className="font-medium">{loan.interest_rate}% per annum</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{loan.duration_months} months</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Purpose:</span>
                          <span className="font-medium capitalize">{loan.purpose || 'General'}</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Monthly Payment:</span>
                          <span className="font-bold text-blue-800">
                            {formatCurrency(calculateMonthlyPayment(loan.principal, loan.interest_rate, loan.duration_months))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Total Repayment:</span>
                          <span className="font-bold text-blue-800">
                            {formatCurrency(calculateMonthlyPayment(loan.principal, loan.interest_rate, loan.duration_months) * loan.duration_months)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="material-symbols-outlined text-yellow-600 mr-2">info</span>
                        <span className="text-sm font-medium text-yellow-800">Pending Approval</span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Review the loan application details and approve or reject based on eligibility criteria.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleApproval(loan.id, true)}
                        disabled={actionLoading === loan.id}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                      >
                        {actionLoading === loan.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined mr-2">check_circle</span>
                            Approve Loan
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleApproval(loan.id, false)}
                        disabled={actionLoading === loan.id}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined mr-2">cancel</span>
                        Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanApprovalDashboard;