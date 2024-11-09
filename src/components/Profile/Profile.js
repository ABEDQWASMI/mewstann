import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PhoneVerification from './PhoneVerification';
import Statistics from './Statistics';
import PaymentSection from './PaymentSection';
import './Profile.css';
import { fetchWithConfig } from '../../utils/api';

function Profile() {
  const { currentUser, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    is_verified: false
  });

  useEffect(() => {
    if (token && currentUser?.id) {
      console.log('Initiating profile fetch with:', { token, userId: currentUser.id });
      fetchProfile();
    }
  }, [token, currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching profile data...');
      const data = await fetchWithConfig('/api/profile');
      console.log('Profile data received:', data);
      
      setProfile({
        ...data,
        username: data.username || currentUser?.username || '',
        email: data.email || currentUser?.email || '',
        bio: data.bio || '',
        location: data.location || '',
        is_verified: data.is_verified || false
      });
    } catch (error) {
      console.error('Profile fetch error details:', {
        message: error.message,
        stack: error.stack,
        currentUser,
        token: token ? 'exists' : 'missing'
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        {profile.is_verified && <span className="verified-badge">✓ Verified</span>}
      </div>

      <div className="profile-grid">
        <div className="profile-section">
          <h2>Personal Information</h2>
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={e => setProfile({...profile, username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({...profile, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={e => setProfile({...profile, location: e.target.value})}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="save-button">Save</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Bio:</strong> {profile.bio || 'No bio added'}</p>
              <p><strong>Location:</strong> {profile.location || 'No location added'}</p>
              <button 
                className="edit-button"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {!profile.is_verified && (
          <PhoneVerification 
            onVerificationComplete={fetchProfile}
          />
        )}

        <Statistics userId={currentUser?.id} />
        
        <PaymentSection userId={currentUser?.id} />
      </div>
    </div>
  );
}

export default Profile;