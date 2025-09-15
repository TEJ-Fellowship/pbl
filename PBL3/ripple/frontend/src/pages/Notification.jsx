import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'follow_request',
      user: {
        name: 'Sophia',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
      },
      message: 'Sophia requested to follow you.',
      timestamp: '2 days ago',
      hasActions: true,
      isAccepted: null
    },
    {
      id: 2,
      type: 'mention',
      user: {
        name: 'Liam',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
      },
      message: 'Liam mentioned you in a Ripple.',
      timestamp: '1 week ago',
      hasActions: false
    },
    {
      id: 3,
      type: 'welcome',
      user: null,
      message: 'Welcome to Ripple!',
      description: 'Get started by sending your first Ripple.',
      timestamp: '2 weeks ago',
      hasActions: false,
      isSystemNotification: true
    }
  ]);

  const handleAccept = (notificationId) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isAccepted: true }
        : notification
    ));
  };

  const handleDecline = (notificationId) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isAccepted: false }
        : notification
    ));
  };

  const NotificationItem = ({ notification }) => (
    <div className="flex items-start gap-4 p-6 border-b border-gray-700 last:border-b-0">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {notification.isSystemNotification ? (
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <img
            src={notification.user.avatar}
            alt={notification.user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white text-base mb-1">
              {notification.message}
            </p>
            {notification.description && (
              <p className="text-gray-400 text-sm mb-2">
                {notification.description}
              </p>
            )}
            <p className="text-gray-500 text-sm">
              {notification.timestamp}
            </p>
          </div>

          {/* Arrow for system notifications */}
          {notification.isSystemNotification && (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
          )}
        </div>

        {/* Action buttons for follow requests */}
        {notification.hasActions && notification.isAccepted === null && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleAccept(notification.id)}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleDecline(notification.id)}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-colors"
            >
              Decline
            </button>
          </div>
        )}

        {/* Show status after action */}
        {notification.hasActions && notification.isAccepted !== null && (
          <div className="mt-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              notification.isAccepted 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {notification.isAccepted ? 'Accepted' : 'Declined'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-8 pb-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Notifications
          </h1>
        </div>

        {/* Notifications List */}
        <div className="bg-gray-800 mx-8 rounded-lg overflow-hidden">
          {notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
            />
          ))}
        </div>

        {/* Empty state if no notifications */}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 11-15 0v5h5l-5-5-5 5h5z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">When you get notifications, they'll show up here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;