import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const KYCApprovalDashboard = () => {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadPendingApplications();
  }, []);

  const loadPendingApplications = async () => {
    try {
      setLoading(true);
      const pending = await adminAPI.getPendingUsers();
      setPendingApplications(pending);
    } catch (err) {
      setError('Failed to load pending applications');
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, approve) => {
    try {
      setActionLoading(userId);
      
      const action = approve ? 'approve' : 'reject';
      const reason = approve ? 'Application meets all KYC requirements' : 'Application does not meet KYC requirements';
      
      await adminAPI.approveKYC(userId, action, reason);
      
      // Remove from pending list
      setPendingApplications(prev => prev.filter(app => app.id !== userId));
      
      // Show success message
      alert(`KYC application has been ${action}d successfully!`);
      
    } catch (err) {
      setError(`Failed to ${approve ? 'approve' : 'reject'} application`);
      console.error('Error updating application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not provided';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">KYC Approval Dashboard</h2>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          {pendingApplications.length} Pending Applications
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {pendingApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Applications</h3>
          <p className="text-gray-600">All KYC applications have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{application.full_name || application.username}</h3>
                    <p className="text-gray-600">Application ID: #{application.id}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApproval(application.id, false)}
                      disabled={actionLoading === application.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {actionLoading === application.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span className="material-symbols-outlined text-sm">close</span>
                      )}
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApproval(application.id, true)}
                      disabled={actionLoading === application.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {actionLoading === application.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-900">{application.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-900">{application.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date of Birth:</span>
                        <p className="text-gray-900">{formatDate(application.date_of_birth)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Nationality:</span>
                        <p className="text-gray-900">{application.nationality || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Marital Status:</span>
                        <p className="text-gray-900">{application.marital_status || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <p className="text-gray-900">{application.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* ID & Employment */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">ID & Employment</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Government ID:</span>
                        <p className="text-gray-900 font-mono">{application.government_id || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">ID Type:</span>
                        <p className="text-gray-900 capitalize">{application.id_type?.replace('_', ' ') || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Occupation:</span>
                        <p className="text-gray-900">{application.occupation || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Employment Type:</span>
                        <p className="text-gray-900 capitalize">{application.employment_type?.replace('_', ' ') || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Annual Income:</span>
                        <p className="text-gray-900">{formatCurrency(application.annual_income)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Employer:</span>
                        <p className="text-gray-900">{application.employer_name || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact & Account */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Emergency Contact & Account</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Emergency Contact:</span>
                        <p className="text-gray-900">{application.emergency_contact_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Emergency Phone:</span>
                        <p className="text-gray-900">{application.emergency_contact_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Relationship:</span>
                        <p className="text-gray-900">{application.emergency_contact_relation || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Account Type:</span>
                        <p className="text-gray-900 capitalize">{application.account_type || 'savings'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Applied On:</span>
                        <p className="text-gray-900">{formatDate(application.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">Risk Assessment</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-green-600">verified_user</span>
                      <span className="text-gray-700">Identity Verification Required</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-blue-600">work</span>
                      <span className="text-gray-700">Employment Verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-purple-600">account_balance</span>
                      <span className="text-gray-700">Income Assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KYCApprovalDashboard;