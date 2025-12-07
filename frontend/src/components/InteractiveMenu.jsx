import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './InteractiveMenu.css';
import { 
  Home, 
  Briefcase, 
  Calendar, 
  Shield, 
  Settings,
  CreditCard,
  Building2,
  FileText,
  Users,
  BarChart3,
  ShieldCheck,
  ArrowLeftRight,
  Rocket,
  Newspaper,
  StickyNote,
  Star,
  TrendingUp
} from 'lucide-react';

export const InteractiveMenu = ({ items, accentColor }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items - same for all users
  const mobileNavItems = [
    { label: 'Dashboard', icon: Home, path: user?.role === 'admin' ? '/admin' : '/dashboard' },
    { label: 'Transactions', icon: ArrowLeftRight, path: user?.role === 'admin' ? '/admin/transactions' : '/statements' },
    { label: 'Accounts', icon: Building2, path: '/accounts' },
    { label: 'Settings', icon: Settings, path: '/profile' }
  ];

  const finalItems = useMemo(() => {
    // Use provided items if valid, otherwise use the 4 mobile nav items
    if (items && Array.isArray(items) && items.length >= 2 && items.length <= 5) {
      return items;
    }
    
    return mobileNavItems;
  }, [items, user]);

  // Find active index based on current path
  const activeIndex = useMemo(() => {
    const currentPath = location.pathname;
    const foundIndex = finalItems.findIndex(item => 
      item.path === currentPath || 
      (item.path !== '/' && currentPath.startsWith(item.path))
    );
    return foundIndex >= 0 ? foundIndex : 0;
  }, [location.pathname, finalItems]);

  const textRefs = useRef([]);
  const itemRefs = useRef([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();
    window.addEventListener('resize', setLineWidth);
    return () => window.removeEventListener('resize', setLineWidth);
  }, [activeIndex, finalItems]);

  const handleItemClick = (index) => {
    const item = finalItems[index];
    if (item.path) {
      navigate(item.path);
    }
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || '#06B6D4';
    return { '--component-active-color': activeColor };
  }, [accentColor]);

  // Only render if user is logged in
  if (!user) {
    return null;
  }

  return (
    <nav
      className="interactive-menu"
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`menu-item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' }}
          >
            <div className="menu-icon">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu-text ${isActive ? 'active' : ''}`}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

export default InteractiveMenu;