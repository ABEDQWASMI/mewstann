import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './Notifications.css';

function NotificationBell() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
      setError(null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [auth?.token]);

  const markAsRead = async (id) => {
    try {
      console.log('Marking notification as read:', id);
      const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark notification as read');
      }

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await markAsRead(notification.id);

      // Close dropdown
      setShowDropdown(false);

      // Navigate based on notification type
      switch (notification.type) {
        case 'new_message':
          navigate(`/messages?conversation=${notification.related_id}`);
          break;
        case 'ad_view':
          navigate(`/ads/${notification.related_id}`);
          break;
        case 'service_view':
          navigate(`/services/${notification.related_id}`);
          break;
        default:
          console.log('Unknown notification type:', notification.type);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  if (!auth?.token) return null;

  return (
    <div className="notification-bell">
      <button 
        className="bell-button" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <h3>Notifications</h3>
          {loading ? (
            <p className="notification-loading">Loading...</p>
          ) : error ? (
            <p className="notification-error">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="notification-empty">No notifications</p>
          ) : (
            <ul>
              {notifications.map(notification => (
                <li 
                  key={notification.id}
                  className={notification.is_read ? 'read' : 'unread'}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p>{notification.content}</p>
                  <span className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell; 