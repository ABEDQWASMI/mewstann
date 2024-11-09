import { useState, useEffect } from 'react';
import './Profile.css';

function Statistics({ userId }) {
  const [stats, setStats] = useState({
    totalAds: 0,
    totalServices: 0,
    totalViews: 0,
    totalMessages: 0,
    activeListings: 0,
    completedDeals: 0,
    averageRating: 0,
    reviewCount: 0,
    monthlyAdLimit: 2,
    adsPostedThisMonth: 0,
    premiumUntil: null,
    isVerified: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/profile/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch statistics');
      }

      const data = await response.json();
      console.log('Received statistics:', data);
      
      setStats({
        ...stats,
        ...data,
        averageRating: Number(data.averageRating) || 0
      });
    } catch (error) {
      console.error('Statistics error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="statistics-loading">Loading statistics...</div>;
  if (error) return <div className="statistics-error">Error: {error}</div>;

  return (
    <div className="statistics-container">
      <h2>Account Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Listings</h3>
          <div className="stat-details">
            <p>Active Ads: {stats.activeListings}</p>
            <p>Total Posted: {stats.totalAds}</p>
            <p>This Month: {stats.adsPostedThisMonth}</p>
          </div>
        </div>

        <div className="stat-card">
          <h3>Performance</h3>
          <div className="stat-details">
            <p>Total Views: {stats.totalViews}</p>
            <p>Completed Deals: {stats.completedDeals}</p>
            <p>Messages: {stats.totalMessages}</p>
          </div>
        </div>

        <div className="stat-card">
          <h3>Reputation</h3>
          <div className="stat-details">
            <p>Rating: {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ⭐` : 'No ratings'}</p>
            <p>Reviews: {stats.reviewCount}</p>
            <p>Verified: {stats.isVerified ? '✓' : '✗'}</p>
          </div>
        </div>

        <div className="stat-card">
          <h3>Account Status</h3>
          <div className="stat-details">
            <p>Monthly Limit: {stats.monthlyAdLimit}</p>
            <p>Posted/Limit: {stats.adsPostedThisMonth}/{stats.monthlyAdLimit}</p>
            {stats.premiumUntil && (
              <p>Premium Until: {new Date(stats.premiumUntil).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics; 