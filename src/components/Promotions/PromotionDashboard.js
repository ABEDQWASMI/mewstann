import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './PromotionDashboard.css';

function PromotionDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/promotions/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!dashboardData) return <div>No promotion data available</div>;

  return (
    <div className="promotion-dashboard">
      <div className="dashboard-header">
        <h1>Promotion Dashboard</h1>
        <div className="stats-overview">
          <div className="stat-card">
            <h3>Total Promotions</h3>
            <p>{dashboardData.stats.total_promotions}</p>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <p>${dashboardData.stats.total_spent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="stat-card">
            <h3>Average CTR</h3>
            <p>{(dashboardData.stats.average_ctr * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="active-promotions">
        <h2>Active Promotions</h2>
        <div className="promotions-grid">
          {dashboardData.activePromotions.map(promotion => (
            <div 
              key={promotion.id} 
              className="promotion-card"
              onClick={() => setSelectedPromotion(promotion)}
            >
              <h3>{promotion.ad_title || promotion.service_title}</h3>
              <div className="promotion-metrics">
                <span>👁 {promotion.views} views</span>
                <span>🖱 {promotion.clicks} clicks</span>
                <span>📊 {((promotion.clicks / promotion.views) * 100).toFixed(2)}% CTR</span>
              </div>
              <div className="promotion-dates">
                <p>Started: {new Date(promotion.start_date).toLocaleDateString()}</p>
                <p>Ends: {new Date(promotion.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPromotion && (
        <div className="promotion-details">
          <h2>Promotion Details</h2>
          {/* Add detailed analytics and charts here */}
        </div>
      )}
    </div>
  );
}

export default PromotionDashboard; 