const API_BASE_URL = 'http://localhost:8000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// API request wrapper with authentication
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  logout: () => {
    removeToken();
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  isAuthenticated: () => {
    return !!getToken();
  },
};

// Accounts API
export const accountsAPI = {
  getAccounts: async () => {
    return await apiRequest('/accounts/me');
  },

  createAccount: async (accountData) => {
    return await apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  getUserAccounts: async (userId) => {
    return await apiRequest(`/accounts/user/${userId}`);
  },
};

// Profile API
export const profileAPI = {
  getProfile: async () => {
    return await apiRequest('/profile/me');
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },
};

// Transactions API
export const transactionsAPI = {
  getMyTransactions: async () => {
    return await apiRequest('/transactions/me');
  },

  getTransactions: async () => {
    return await apiRequest('/transactions');
  },

  createTransaction: async (transactionData) => {
    return await apiRequest('/transactions/initiate', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  searchUsers: async (query) => {
    return await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
  },
};

// Fixed Deposits API
export const fixedDepositsAPI = {
  getMyFDs: async () => {
    return await apiRequest('/fixed-deposits/me');
  },

  createFD: async (fdData) => {
    return await apiRequest('/fixed-deposits/', {
      method: 'POST',
      body: JSON.stringify(fdData),
    });
  },
  renewFD: async (fdId, principal, tenureMonths) => {
    return await apiRequest(`/fixed-deposits/${fdId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ principal, tenure_months: tenureMonths }),
    });
  },
};

// Loans API
export const loansAPI = {
  getMyLoans: async () => {
    return await apiRequest('/loans/me');
  },
  applyLoan: async (loanData) => {
    return await apiRequest('/loans/', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  },
  payLoan: async (loanId, amount) => {
    return await apiRequest(`/loans/${loanId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};

// Cards API
export const cardsAPI = {
  getMyCards: async () => {
    return await apiRequest('/cards/me');
  },
  requestCard: async (cardData) => {
    return await apiRequest('/cards/', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  },
  getCard: async (cardId) => {
    return await apiRequest(`/cards/${cardId}`);
  },
  blockCard: async (cardId, pin) => {
    return await apiRequest(`/cards/${cardId}/block`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },
  unblockCard: async (cardId, pin) => {
    return await apiRequest(`/cards/${cardId}/unblock`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },
  verifyPin: async (cardId, pin) => {
    return await apiRequest(`/cards/${cardId}/verify-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },
  changePin: async (cardId, currentPin, newPin) => {
    return await apiRequest(`/cards/${cardId}/change-pin`, {
      method: 'POST',
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getSummary: async () => {
    return await apiRequest('/dashboard/summary');
  },
};

// Admin API
export const adminAPI = {
  setupAdmin: async () => {
    return await apiRequest('/admin/setup-admin', { method: 'POST' });
  },
  getStats: async () => {
    return await apiRequest('/admin/stats');
  },
  getUsers: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/users?skip=${skip}&limit=${limit}`);
  },
  getAllUsers: async () => {
    return await apiRequest('/admin/users?skip=0&limit=1000');
  },
  getTransactions: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/transactions?skip=${skip}&limit=${limit}`);
  },
  getAccounts: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/accounts?skip=${skip}&limit=${limit}`);
  },
  createUser: async (userData) => {
    return await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  updateUser: async (userId, userData) => {
    return await apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  deleteUser: async (userId) => {
    return await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
  },
  adjustBalance: async (accountId, amount, reason) => {
    return await apiRequest(`/admin/accounts/${accountId}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
  
  // KYC Approval APIs
  getPendingUsers: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/pending-users?skip=${skip}&limit=${limit}`);
  },
  
  approveKYC: async (userId, action, reason = null) => {
    return await apiRequest('/admin/approve-kyc', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, action, reason }),
    });
  },
  
  // Cards Approval APIs
  getPendingCards: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/pending-cards?skip=${skip}&limit=${limit}`);
  },
  
  approveCard: async (cardId, action, reason = null) => {
    return await apiRequest('/admin/approve-card', {
      method: 'POST',
      body: JSON.stringify({ item_id: cardId, action, reason }),
    });
  },
  
  // Loans Approval APIs
  getPendingLoans: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/pending-loans?skip=${skip}&limit=${limit}`);
  },
  
  approveLoan: async (loanId, action, reason = null) => {
    return await apiRequest('/admin/approve-loan', {
      method: 'POST',
      body: JSON.stringify({ item_id: loanId, action, reason }),
    });
  },
  
  // Fixed Deposits Approval APIs
  getPendingFixedDeposits: async (skip = 0, limit = 100) => {
    return await apiRequest(`/admin/pending-fixed-deposits?skip=${skip}&limit=${limit}`);
  },
  
  approveFixedDeposit: async (fdId, action, reason = null) => {
    return await apiRequest('/admin/approve-fixed-deposit', {
      method: 'POST',
      body: JSON.stringify({ item_id: fdId, action, reason }),
    });
  },
};

export { getToken, setToken, removeToken, apiRequest };
