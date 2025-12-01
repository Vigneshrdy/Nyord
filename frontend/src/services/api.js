const API_BASE_URL = 'https://taksari.me/api';

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

export { getToken, setToken, removeToken };
