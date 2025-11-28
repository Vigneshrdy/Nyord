import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import '../styles/auth-animations.css';

const AuthContainer = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('signin');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const newPage = location.pathname === '/signup' ? 'signup' : 'signin';
    if (newPage !== currentPage) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(newPage);
        setIsTransitioning(false);
      }, 300);
    }
  }, [location.pathname, currentPage]);

  return (
    <div className="auth-container gradient-bg">
      {/* SignIn Page */}
      <div
        className={`absolute inset-0 transition-transform duration-700 ease-out ${
          currentPage === 'signin'
            ? 'translate-x-0 opacity-100'
            : 'translate-x-[-100%] opacity-0'
        }`}
      >
        <SignInForm />
      </div>

      {/* SignUp Page */}
      <div
        className={`absolute inset-0 transition-transform duration-700 ease-out ${
          currentPage === 'signup'
            ? 'translate-x-0 opacity-100'
            : 'translate-x-[100%] opacity-0'
        }`}
      >
        <SignUpForm />
      </div>

      {/* Enhanced loading overlay during transition */}
      {isTransitioning && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default AuthContainer;