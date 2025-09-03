import React from 'react'
import { useNotification } from '../contexts/NotificationContext'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const Notification: React.FC = () => {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-400 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-400 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-400 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start p-4 border-l-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out ${getStyles(notification.type)}`}
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          <div className="flex-shrink-0 mr-3">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>
        {`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}
      </style>
    </div>
  )
}

export default Notification