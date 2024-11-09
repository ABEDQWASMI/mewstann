import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Conversations.css';

function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        setConversations(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (token) {
      fetchConversations();
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  if (loading) return <div className="conversations-container">Loading...</div>;
  if (error) return <div className="conversations-container">Error: {error}</div>;

  return (
    <div className="conversations-container">
      <h2>Your Conversations</h2>
      {conversations.length === 0 ? (
        <p>No conversations yet</p>
      ) : (
        <div className="conversations-list">
          {conversations.map(conversation => (
            <Link 
              to={`/messages/${conversation.id}`} 
              key={conversation.id} 
              className="conversation-item"
            >
              <div className="conversation-info">
                <h3>{conversation.other_username}</h3>
                <p className="last-message">
                  {conversation.last_message || 'No messages yet'}
                </p>
                {conversation.last_message_time && (
                  <small className="message-time">
                    {new Date(conversation.last_message_time).toLocaleString()}
                  </small>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Conversations; 