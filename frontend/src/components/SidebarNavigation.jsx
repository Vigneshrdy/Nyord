import { cn } from "../lib/utils";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationApiContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Home,
  CreditCard,
  FileText,
  PiggyBank,
  Building,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  BarChart3,
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  QrCode,
  HelpCircle,
  MessageCircle,
  Sun,
  Moon,
  icons
} from 'lucide-react';

// Sidebar Context
const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-6 py-6 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[280px] flex-shrink-0",
        className
      )}
      animate={{
        width: "280px",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-lg transition-all",
        isActive ? "bg-teal-600 text-white" : "hover:bg-neutral-200 dark:hover:bg-neutral-700",
        className
      )}
    >
      {link.icon}
      <span className="text-neutral-700 dark:text-neutral-200 text-base group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
        {link.label}
      </span>
    </Link>
  );
};

const SidebarNavigation = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // Role-based navigation items (admin vs user)
  const navItems = [
    ...(user?.role === 'admin'
      ? [
          { href: "/admin", label: "Overview", icon: <BarChart3 size={24} /> },
          { href: "/admin/kyc", label: "KYC Approval", icon: <ShieldCheck size={24} /> },
          { href: "/admin/loans", label: "Loan Approvals", icon: <TrendingUp size={24} /> },
          { href: "/admin/cards", label: "Card Approvals", icon: <CreditCard size={24} /> },
          { href: "/admin/accounts", label: "Account approvals",icon: <Building2 size={24} /> },
          { href: "/admin/transactions", label: "Transactions",icon: <CreditCard size={24} /> },
          { href: "/admin/users", label: "Users", icon: <Users size={24} /> }
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: <Home size={24} /> },
          { href: "/accounts", label: "Accounts", icon: <Building2 size={24} /> },
          { href: "/transfer", label: "Transfer Money", icon: <CreditCard size={24} /> },
          { href: "/qr-payment", label: "QR Payment", icon: <QrCode size={24} /> },
          { href: "/cards", label: "Cards", icon: <CreditCard size={24} /> },
          { href: "/statements", label: "Statements", icon: <FileText size={24} /> },
          { href: "/loans", label: "Loans", icon: <Building size={24} /> },
          { href: "/fixed-deposits", label: "FDs", icon: <TrendingUp size={24} /> }
        ]),
    // Common links
    { href: "/notifications", label: "Notifications", icon: <Bell size={24} /> },
    { href: "/profile", label: "Settings", icon: <Settings size={24} /> }
  ];

  // Secondary navigation items (help + theme)
  const secondaryItems = [
    { href: "/help", label: "Help", icon: <HelpCircle size={24} /> }
  ];

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
              <span className="text-xl font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              Nyord
            </span>
          </div>

          {/* Main Menu */}
          <div className="mt-8 flex flex-col gap-2">
            {navItems.map((item, idx) => (
              <SidebarLink
                key={idx}
                link={item}
                className="text-sm"
              />
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-8 flex flex-col gap-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              HELP
            </p>
            {secondaryItems.map((item, idx) => (
              <SidebarLink
                key={idx}
                link={item}
                className="text-sm"
              />
            ))}
            
            {/* Theme Toggle */}
            {/* <button
              onClick={toggleTheme}
              className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-neutral-700 dark:text-neutral-200 text-base"
            >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button> */}
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-750 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatar-1.png" alt="User avatar" />
            <AvatarFallback className="bg-teal-600 text-white text-sm">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-base text-neutral-800 dark:text-neutral-200">{user.username}</p>
            <p className="text-sm text-neutral-500 capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <LogOut size={20} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

export default SidebarNavigation;