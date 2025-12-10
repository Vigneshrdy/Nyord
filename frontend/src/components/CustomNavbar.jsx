import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationApiContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import ThemeToggle from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

// Admin Navigation Buttons Component
const AdminNavigationButtons = ({ isLandingPage, isActive, location }) => {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        to="/admin"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#06B6D4]"
        } ${isActive('/admin') && location.pathname === '/admin' ? "bg-[#06B6D4] text-white" : ""}`}
      >
        <svg className="lucide lucide-bar-chart-3 text-cyan-500 dark:text-cyan-400" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#06B6D4" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
        Overview
      </Link>
      
      <Link
        to="/admin/kyc"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#10B981]"
        } ${isActive('/admin/kyc') ? "bg-[#10B981] text-white" : ""}`}
      >
        <svg className="lucide lucide-shield-check text-green-500 dark:text-green-400" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#10B981" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        KYC Approvals
      </Link>

      <Link
        to="/admin/accounts"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#8B5CF6]"
        } ${isActive('/admin/accounts') ? "bg-[#8B5CF6] text-white" : ""}`}
      >
        <svg className="lucide lucide-building-2 text-purple-500 dark:text-purple-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#8B5CF6" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
        Accounts
      </Link>
      
      <Link
        to="/admin/loans"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#FACC14]"
        } ${isActive('/admin/loans') ? "bg-[#FACC14] text-white" : ""}`}
      >
        <svg className="lucide lucide-credit-card text-yellow-400 dark:text-yellow-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#FACC14" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
        Loan Approvals
      </Link>
      
      <Link
        to="/admin/cards"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#EF4444]"
        } ${isActive('/admin/cards') ? "bg-[#EF4444] text-white" : ""}`}
      >
        <svg className="lucide lucide-credit-card text-red-500 dark:text-red-400" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#EF4444" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
        Card Approvals
      </Link>
      
      <Link
        to="/admin/users"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#FB923C]"
        } ${isActive('/admin/users') ? "bg-[#FB923C] text-white" : ""}`}
      >
        <svg className="lucide lucide-users text-orange-400 dark:text-orange-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#FB923C" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 21-2-2" />
          <path d="m16 16 2 2" />
          <path d="m22 16-2 2" />
          <path d="m16 21 2-2" />
        </svg>
        Users
      </Link>
      
      <Link
        to="/admin/transactions"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#6366F1]"
        } ${isActive('/admin/transactions') ? "bg-[#6366F1] text-white" : ""}`}
      >
        <svg className="lucide lucide-arrow-left-right text-indigo-500 dark:text-indigo-400" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#6366F1" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3L4 7l4 4" />
          <path d="M4 7h16" />
          <path d="M16 21l4-4-4-4" />
          <path d="M20 17H4" />
        </svg>
        Transactions
      </Link>
    </div>
  );
};

// Customer Navigation Buttons Component
const CustomerNavigationButtons = ({ isLandingPage, isActive }) => {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        to="/dashboard"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#06B6D4]"
        } ${isActive('/dashboard') ? "bg-[#06B6D4] text-white" : ""}`}
      >
        <svg className="lucide lucide-rocket text-cyan-500 dark:text-cyan-400" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#06B6D4" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
        Dashboard
      </Link>
      
      <Link
        to="/statements"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#60A5FA]"
        } ${isActive('/statements') ? "bg-[#60A5FA] text-white" : ""}`}
      >
        <svg className="lucide lucide-newspaper text-blue-400 dark:text-blue-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#60A5FA" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
        Statements
      </Link>

      <Link
        to="/accounts"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#8B5CF6]"
        } ${isActive('/accounts') ? "bg-[#8B5CF6] text-white" : ""}`}
      >
        <svg className="lucide lucide-building-2 text-purple-500 dark:text-purple-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#8B5CF6" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
        Accounts
      </Link>
      
      <Link
        to="/loans"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#FACC14]"
        } ${isActive('/loans') ? "bg-[#FACC14] text-white" : ""}`}
      >
        <svg className="lucide lucide-sticky-note text-yellow-400 dark:text-yellow-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#FACC14" fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
          <path d="M15 3v6h6" />
        </svg>
        Loans
      </Link>
      
      <Link
        to="/cards"
        className={`cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${
          isLandingPage 
            ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            : "bg-white hover:bg-[#F5F5F5] hover:text-[#FB923C]"
        } ${isActive('/cards') ? "bg-[#FB923C] text-white" : ""}`}
      >
        <svg className="lucide lucide-star text-orange-400 dark:text-orange-600" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#FB923C" fill="#FB923C" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Cards
      </Link>
    </div>
  );
};

// Mobile Navigation Component
const MobileNav = ({ isLandingPage, userRole }) => {
  const [open, setOpen] = useState(false);
  
  const adminLinks = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/kyc", label: "KYC Approvals" },
    { to: "/admin/accounts", label: "Accounts" },
    { to: "/admin/loans", label: "Loan Approvals" },
    { to: "/admin/cards", label: "Card Approvals" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/transactions", label: "Transactions" }
  ];

  const customerLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/statements", label: "Statements" },
    { to: "/accounts", label: "Accounts" },
    { to: "/loans", label: "Loans" },
    { to: "/cards", label: "Cards" }
  ];

  const links = userRole === 'admin' ? adminLinks : customerLinks;
  
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-md ${
          isLandingPage 
            ? "text-white hover:bg-white/20" 
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      
      {open && (
        <div className={`absolute top-16 left-0 right-0 p-4 ${
          isLandingPage 
            ? "bg-black/80 backdrop-blur-sm text-white" 
            : "bg-white border-b shadow-lg"
        }`}>
          <div className="flex flex-col space-y-2">
            {links.map((link, index) => (
              <Link 
                key={index}
                to={link.to} 
                className="p-2 rounded hover:bg-white/20" 
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Theme Toggle for Mobile */}
            <div className="p-2 border-t border-white/20 mt-2 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Profile Dropdown
const UserProfileDropdown = ({ isLandingPage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (!user) return null;

  const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-8 w-8">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar-1.png" alt="User avatar" />
            <AvatarFallback className={isLandingPage ? "bg-white/20 text-white" : "bg-teal-600 text-white"}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Notification Component
const NotificationComponent = ({ isLandingPage }) => {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <Link 
      to="/notifications"
      className={`relative p-2 rounded-md transition-colors ${
        isLandingPage 
          ? "text-white hover:bg-white/20" 
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 4h1v16H4V4zm0 0h16v12H4V4z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};

// Main Custom Navbar Component
const CustomNavbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if current page should have transparent navbar
  const transparentPages = ['/', '/signin', '/signup', '/forgot-password'];
  const isLandingPage = transparentPages.includes(location.pathname);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full fixed top-0 z-50 transition-all duration-300 bg-transparent border-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className={`hidden text-xl font-bold sm:inline-block transition-colors ${
                isLandingPage ? "text-white" : "text-gray-900 dark:text-white"
              }`}>
                Nyord
              </span>
            </Link>
            
            {user && <MobileNav isLandingPage={isLandingPage} userRole={user.role} />}
          </div>

          {/* Navigation Section */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex mr-4">
                {user.role === 'admin' ? (
                  <AdminNavigationButtons isLandingPage={isLandingPage} isActive={isActive} location={location} />
                ) : (
                  <CustomerNavigationButtons isLandingPage={isLandingPage} isActive={isActive} />
                )}
              </div>
            )}

            {user ? (
              <>
                <NotificationComponent isLandingPage={isLandingPage} />
                <UserProfileDropdown isLandingPage={isLandingPage} />
              </>
            ) : (
              /* Sign In / Sign Up Buttons */
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomNavbar;