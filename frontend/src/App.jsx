import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationApiContext';
import { ThemeProvider } from './contexts/ThemeContext';
import CustomNavbar from './components/CustomNavbar';
import SidebarNavigation from './components/SidebarNavigation';
import InteractiveMenu from './components/InteractiveMenu';
import NotificationContainer from './components/NotificationContainer';
import NotificationTester from './components/NotificationTester';
import ConvAIWidget from './components/ConvAIWidget';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useServiceWorkerNavigation, serviceWorkerManager } from './services/serviceWorkerManager';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthContainer from './components/AuthContainer';
import ForgotPassword from './pages/ForgotPassword';
import ManageCards from './pages/ManageCards';
import AccountStatements from './pages/AccountStatements';
import AccountManager from './pages/AccountManager';
import Loans from './pages/Loans';
import FixedDeposits from './pages/FixedDeposits';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Transfer from './pages/Transfer';
import Statistics from './pages/Statistics';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import QRPayment from './pages/QRPayment';
import PaymentPage from './pages/PaymentPage';
import Feedback from './pages/Feedback';
import NotFound from './pages/NotFound';

// Layout wrapper component to handle conditional sidebar
function LayoutWrapper({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  
  // Enable service worker navigation
  useServiceWorkerNavigation();
  
  // Pages that should not have sidebar navigation
  const noSidebarPages = ['/', '/signin', '/signup', '/forgot-password', '/pay'];
  const shouldShowSidebar = user && !noSidebarPages.includes(location.pathname);

  if (shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <SidebarNavigation />
        <main className="flex-1 min-h-screen overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <CustomNavbar />
      <main>
        {children}
      </main>
      <InteractiveMenu />
    </div>
  );
}

function App() {
  // Register service worker on app load
  useEffect(() => {
    serviceWorkerManager.register();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <NotificationProvider>
            <NotificationContainer />
            <NotificationTester />
            <ConvAIWidget />
            <LayoutWrapper>
            <Routes>
              <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<AuthContainer />} />
            <Route path="/signup" element={<AuthContainer />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/cards" element={
              <ProtectedRoute>
                <ManageCards />
              </ProtectedRoute>
            } />
            <Route path="/statements" element={
              <ProtectedRoute>
                <AccountStatements />
              </ProtectedRoute>
            } />
            <Route path="/statistics" element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <AccountManager />
              </ProtectedRoute>
            } />
            <Route path="/loans" element={
              <ProtectedRoute>
                <Loans />
              </ProtectedRoute>
            } />
            <Route path="/fixed-deposits" element={
              <ProtectedRoute>
                <FixedDeposits />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/transfer" element={
              <ProtectedRoute>
                <Transfer />
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/kyc" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/loans" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/cards" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/transactions" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/accounts" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/qr-payment" element={
              <ProtectedRoute>
                <QRPayment />
              </ProtectedRoute>
            } />
            {/* Stocks page removed - replaced by Accounts */}
              <Route path="/pay" element={<PaymentPage />} />
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LayoutWrapper>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
