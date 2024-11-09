import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PublicProfile.css';

function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [activeListings, setActiveListings] = useState({ ads: [], services: [] });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicProfile();
    fetchActiveListings();
    fetchReviews();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/public`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchActiveListings = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/listings`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch listings');
      
      const data = await response.json();
      setActiveListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/reviews`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="public-profile-loading">Loading profile...</div>;
  if (error) return <div className="public-profile-error">{error}</div>;
  if (!profile) return <div className="public-profile-not-found">Profile not found</div>;

  return (
    <div className="public-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profile_photo ? (
            <img src={`http://localhost:5000${profile.profile_photo}`} alt={profile.username} />
          ) : (
            <div className="avatar-placeholder">{profile.username[0].toUpperCase()}</div>
          )}
        </div>
        
        <div className="profile-info">
          <h1>{profile.username}</h1>
          <div className="profile-stats">
            <span>⭐ {profile.rating.toFixed(1)} ({profile.review_count} reviews)</span>
            <span>📍 {profile.location || 'Location not specified'}</span>
            <span>🗓 Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          
          {profile.verified && (
            <div className="verification-badges">
              {profile.phone_verified && <span className="badge">📱 Phone Verified</span>}
              {profile.email_verified && <span className="badge">📧 Email Verified</span>}
              {profile.address_verified && <span className="badge">🏠 Address Verified</span>}
              {profile.identity_verified && <span className="badge">🪪 ID Verified</span>}
            </div>
          )}
        </div>
      </div>

      <div className="profile-bio">
        <h2>About</h2>
        <p>{profile.bio || 'No bio provided'}</p>
      </div>

      {profile.work_history && profile.work_history.length > 0 && (
        <div className="work-history">
          <h2>Work History</h2>
          {profile.work_history.map((work, index) => (
            <div key={index} className="work-item">
              <h3>{work.title}</h3>
              <p>{work.description}</p>
              <span className="work-date">
                {new Date(work.start_date).toLocaleDateString()} - 
                {work.end_date ? new Date(work.end_date).toLocaleDateString() : 'Present'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="active-listings">
        <h2>Active Listings</h2>
        <div className="listings-grid">
          {activeListings.ads.map(ad => (
            <Link to={`/ad/${ad.id}`} key={ad.id} className="listing-card">
              {ad.image_url && (
                <img src={`http://localhost:5000${ad.image_url}`} alt={ad.title} />
              )}
              <div className="listing-details">
                <h3>{ad.title}</h3>
                <p className="price">${ad.price}</p>
              </div>
            </Link>
          ))}
          
          {activeListings.services.map(service => (
            <Link to={`/service/${service.id}`} key={service.id} className="listing-card service">
              {service.image_url && (
                <img src={`http://localhost:5000${service.image_url}`} alt={service.title} />
              )}
              <div className="listing-details">
                <h3>{service.title}</h3>
                <p className="price">Starting at ${service.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="reviews-section">
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="rating">{'⭐'.repeat(review.rating)}</span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <div className="reviewer">
                  <Link to={`/user/${review.reviewer_id}`}>
                    {review.reviewer_name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">No reviews yet</p>
        )}
      </div>
    </div>
  );
}

export default PublicProfile; 