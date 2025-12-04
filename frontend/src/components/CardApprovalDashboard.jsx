import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationApiContext';

const CardApprovalDashboard = () => {
  const { showSuccess, showError } = useNotifications();
  const [pendingCards, setPendingCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadPendingCards();
  }, []);

  const loadPendingCards = async () => {
    try {
      setLoading(true);
      const pending = await adminAPI.getPendingCards();
      console.log('Pending cards data:', pending);
      
      // If user details are missing, try to fetch them
      const enrichedCards = await Promise.all(
        pending.map(async (card) => {
          if (!card.user && card.user_id) {
            try {
              const allUsers = await adminAPI.getAllUsers();
              const user = allUsers.find(u => u.id === card.user_id);
              return { ...card, user };
            } catch (error) {
              console.log('Could not fetch user details for card:', card.id);
              return card;
            }
          }
          return card;
        })
      );
      
      setPendingCards(enrichedCards);
    } catch (err) {
      setError('Failed to load pending card applications');
      console.error('Error loading card applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (cardId, approve) => {
    try {
      setActionLoading(cardId);
      
      const action = approve ? 'approve' : 'reject';
      const reason = approve ? 'Card application meets all requirements' : 'Card application does not meet requirements';
      
      await adminAPI.approveCard(cardId, action, reason);
      
      // Remove from pending list
      setPendingCards(prev => prev.filter(card => card.id !== cardId));
      
      // Show success message
      showSuccess(
        'Card Application Updated',
        `Card application has been ${action}d successfully!${approve ? ' The card will be activated and available for use.' : ''}`
      );
      
    } catch (err) {
      setError(`Failed to ${approve ? 'approve' : 'reject'} card application`);
      console.error('Error updating card application:', err);
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

  const getCardTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit':
        return 'credit_card';
      case 'debit':
        return 'payment';
      default:
        return 'credit_card';
    }
  };

  const getCardTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit':
        return 'bg-purple-500';
      case 'debit':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading pending card applications...</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Card Approval Dashboard</h2>
            <p className="text-gray-600 mt-1">Review and approve pending card applications</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-blue-600">credit_card</span>
            <span className="text-sm font-medium text-gray-700">
              {pendingCards.length} Pending Application{pendingCards.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {pendingCards.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">credit_card</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Card Applications</h3>
            <p className="text-gray-500">All card applications have been processed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingCards.map((card) => (
              <div key={card.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Applicant Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {card.user?.username?.charAt(0)?.toUpperCase() || (card.user?.full_name?.charAt(0)?.toUpperCase()) || card.user_id?.toString().charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {card.user?.username || card.user?.full_name || `User ${card.user_id || 'Unknown'}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {card.user_id || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">User ID:</span>
                          <span className="font-medium">{card.user_id || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Username:</span>
                          <span className="font-medium">{card.user?.username || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium">{card.user?.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-medium">{card.user?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Applied On:</span>
                          <span className="font-medium">{formatDate(card.created_at)}</span>
                        </div>
                      </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-purple-600">credit_card</span>
                      Card Details
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Card Visual Representation */}
                      <div className={`${getCardTypeColor(card.card_type)} rounded-lg p-4 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs opacity-75">NYORD BANK</p>
                              <p className="text-sm font-medium capitalize">{card.card_type} Card</p>
                            </div>
                            <span className="material-symbols-outlined text-2xl">
                              {getCardTypeIcon(card.card_type)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs opacity-75">Card Number</p>
                            <p className="font-mono text-sm">**** **** **** {card.card_number?.slice(-4) || '****'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Card Type:</span>
                          <span className="font-medium capitalize">{card.card_type}</span>
                        </div>
                        {card.credit_limit && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Credit Limit:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(card.credit_limit)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Approval
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
                        Review the card application details and approve or reject based on eligibility criteria.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleApproval(card.id, true)}
                        disabled={actionLoading === card.id}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                      >
                        {actionLoading === card.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined mr-2">check_circle</span>
                            Approve Card
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleApproval(card.id, false)}
                        disabled={actionLoading === card.id}
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

export default CardApprovalDashboard;