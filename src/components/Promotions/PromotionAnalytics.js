import { useState, useEffect } from 'react';
import {
  Line,
  Bar,
  Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './PromotionAnalytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function PromotionAnalytics({ promotionId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d'); // '7d', '30d', '90d'

  useEffect(() => {
    fetchAnalytics();
  }, [promotionId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/promotions/analytics?promotionId=${promotionId}&range=${dateRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="analytics-loading">Loading analytics...</div>;
  if (error) return <div className="analytics-error">{error}</div>;
  if (!analytics) return <div>No analytics data available</div>;

  const viewsData = {
    labels: analytics.dailyMetrics.map(d => d.date),
    datasets: [
      {
        label: 'Views',
        data: analytics.dailyMetrics.map(d => d.views),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Clicks',
        data: analytics.dailyMetrics.map(d => d.clicks),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  const conversionData = {
    labels: ['Converted', 'Not Converted'],
    datasets: [{
      data: [analytics.overview.total_clicks, analytics.overview.total_views - analytics.overview.total_clicks],
      backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)']
    }]
  };

  return (
    <div className="promotion-analytics">
      <div className="analytics-header">
        <h2>Promotion Analytics</h2>
        <div className="date-range-selector">
          <button 
            className={dateRange === '7d' ? 'active' : ''} 
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={dateRange === '30d' ? 'active' : ''} 
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={dateRange === '90d' ? 'active' : ''} 
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="metric-card">
          <h3>Total Views</h3>
          <p>{analytics.overview.total_views}</p>
        </div>
        <div className="metric-card">
          <h3>Total Clicks</h3>
          <p>{analytics.overview.total_clicks}</p>
        </div>
        <div className="metric-card">
          <h3>CTR</h3>
          <p>{((analytics.overview.total_clicks / analytics.overview.total_views) * 100).toFixed(2)}%</p>
        </div>
        <div className="metric-card">
          <h3>Cost per Click</h3>
          <p>${(analytics.overview.payment_amount / analytics.overview.total_clicks).toFixed(2)}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Views & Clicks Over Time</h3>
          <Line 
            data={viewsData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Conversion Rate</h3>
          <Doughnut 
            data={conversionData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default PromotionAnalytics; 