import { useState } from 'react';
import './ProfilePhoto.css';

function ProfilePhoto({ currentPhoto, onPhotoUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      onPhotoUpdate(data.photo_url);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-photo-container">
      <div className="profile-photo">
        {currentPhoto ? (
          <img src={`http://localhost:5000${currentPhoto}`} alt="Profile" />
        ) : (
          <div className="photo-placeholder">
            <span>👤</span>
          </div>
        )}
      </div>
      
      <div className="photo-upload">
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={uploading}
        />
        <label htmlFor="photo-upload" className={uploading ? 'uploading' : ''}>
          {uploading ? 'Uploading...' : 'Change Photo'}
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ProfilePhoto; 