import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Ads.css';

function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdDetails = useCallback(async () => {
    try {
      console.log('Fetching ad details for ID:', id);
      const response = await fetch(`http://localhost:5000/api/listings/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ad details');
      }

      console.log('Received ad data:', data);
      setAd(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ad details:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAdDetails();
  }, [fetchAdDetails]);

  const handleContact = useCallback(async () => {
    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.id === ad.user_id) {
      setError("This is your own ad - you can't contact yourself");
      return;
    }

    try {
      console.log('Starting conversation with user:', ad.user_id);
      const response = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          other_user_id: ad.user_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      console.log('Conversation created:', data);
      navigate(`/messages/${data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error.message || 'Failed to start conversation');
    }
  }, [token, currentUser, ad?.user_id, navigate]);

  const handleDelete = useCallback(async () => {
    if (!token || !currentUser || !ad || currentUser.id !== ad.user_id) {
      return;
    }

    try {
      console.log('Deleting ad:', id);
      const response = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete ad');
      }

      console.log('Ad deleted successfully');
      navigate('/ads');
    } catch (error) {
      console.error('Error deleting ad:', error);
      setError('Failed to delete ad');
    }
  }, [token, currentUser, ad?.user_id, id, navigate]);

  if (loading) {
    return (
      <div className="ad-detail-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-detail-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => navigate('/ads')} className="back-button">
            Back to Ads
          </button>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="ad-detail-container">
        <div className="error">
          <p>Ad not found</p>
          <button onClick={() => navigate('/ads')} className="back-button">
            Back to Ads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-detail-container">
      <div className="ad-detail">
        <div className="ad-detail-header">
          <h2>{ad.title}</h2>
          <button onClick={() => navigate('/ads')} className="back-button">
            Back to Ads
          </button>
        </div>

        {ad.image_url && (
          <div className="ad-image">
            <img 
              src={`http://localhost:5000${ad.image_url}`} 
              alt={ad.title}
              onError={(e) => {
                console.error('Error loading image');
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
        )}

        <div className="ad-info">
          <div className="ad-main-info">
            <p className="price">${ad.price}</p>
            <p className="category">Category: {ad.category}</p>
          </div>

          <div className="ad-description">
            <h3>Description</h3>
            <p>{ad.description}</p>
          </div>

          <div className="ad-seller-info">
            <p className="seller">Posted by: {ad.username}</p>
            <p className="date">
              Posted on: {new Date(ad.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="ad-actions">
            {currentUser && ad && currentUser.id === ad.user_id ? (
              <div className="owner-actions">
                <p className="owner-message">This is your ad</p>
                <button 
                  onClick={() => navigate(`/edit-ad/${id}`)} 
                  className="edit-button"
                >
                  Edit Ad
                </button>
                <button 
                  onClick={handleDelete} 
                  className="delete-button"
                >
                  Delete Ad
                </button>
              </div>
            ) : (
              <button 
                onClick={handleContact} 
                className="contact-button"
                disabled={!currentUser || (currentUser && currentUser.id === ad?.user_id)}
              >
                {!currentUser ? 'Login to Contact Seller' : 
                 currentUser.id === ad?.user_id ? 'This is your ad' : 
                 'Contact Seller'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdDetail;
