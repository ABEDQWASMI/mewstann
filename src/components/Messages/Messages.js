import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Messages.css';

function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        console.log('Fetching conversations with token:', token);
        const response = await fetch('http://localhost:5000/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch conversations');
        }

        const data = await response.json();
        console.log('Received conversations:', data);
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
    }
  }, [token]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (conversationId) {
      console.log('Fetching messages for conversation:', conversationId);
      const fetchMessages = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch messages');
          }

          const data = await response.json();
          console.log('Messages received:', data);
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
          setError(error.message);
        }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId, token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="messages-loading">Loading...</div>;
  }

  if (error) {
    return <div className="messages-error">{error}</div>;
  }

  return (
    <div className="messages-container">
      {/* Conversations List */}
      <div className="conversations-list">
        <h2>Conversations</h2>
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map(conv => (
            <Link
              to={`/messages/${conv.id}`}
              key={conv.id}
              className={`conversation ${conv.id === parseInt(conversationId) ? 'selected' : ''}`}
            >
              <div className="conversation-preview">
                <h3>{conv.other_username}</h3>
                <p>{conv.last_message || 'No messages yet'}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Messages View */}
      <div className="messages-view">
        {!conversationId ? (
          <div className="no-conversation-selected">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            <div className="messages-list">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender_id === currentUser?.id ? 'sent' : 'received'}`}
                >
                  <p>{message.content}</p>
                  <span className="message-time">
                    {message.sender_username} • 
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages; 