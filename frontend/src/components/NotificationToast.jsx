import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationToast = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  const getToastStyles = (type) => {
    const baseStyles = "fixed z-50 transition-all duration-300 ease-in-out transform";
    const typeStyles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return `${baseStyles} ${typeStyles[type] || typeStyles.info}`;
  };

  const getIconColor = (type) => {
    const colors = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} p-4 rounded-lg border shadow-lg animate-in slide-in-from-right duration-300`}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={`flex-shrink-0 ${getIconColor(toast.type)}`}>
              <span className="material-symbols-outlined text-xl">
                {toast.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="font-semibold text-sm mb-1">
                  {toast.title}
                </h4>
              )}
              {toast.message && (
                <p className="text-sm opacity-90">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-lg opacity-60 hover:opacity-100">
                close
              </span>
            </button>
          </div>

          {/* Progress Bar (optional) */}
          {toast.showProgress !== false && (
            <div className="mt-3 w-full bg-black/10 rounded-full h-1 overflow-hidden">
              <div 
                className="h-full bg-current opacity-40 animate-toast-progress"
                style={{
                  animationDuration: `${toast.duration || 4000}ms`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;