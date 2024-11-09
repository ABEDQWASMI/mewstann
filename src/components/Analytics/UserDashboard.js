import { useState, useEffect } from 'react';
import {
  Line,
  Bar,
  Doughnut,
  Radar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './UserDashboard.css';

ChartJS.register(
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function UserDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/analytics/dashboard?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading analytics...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!analytics) return <div>No analytics data available</div>;

  const performanceData = {
    labels: analytics.dailyMetrics.map(d => d.date),
    datasets: [
      {
        label: 'Views',
        data: analytics.dailyMetrics.map(d => d.views),
        borderColor: 'rgb(75, 192, 192)',
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      },
      {
        label: 'Interactions',
        data: analytics.dailyMetrics.map(d => d.interactions),
        borderColor: 'rgb(255, 99, 132)',
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)'
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(analytics.categoryBreakdown),
    datasets: [{
      data: Object.values(analytics.categoryBreakdown),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ]
    }]
  };

  const activityMetrics = {
    labels: ['Posts', 'Comments', 'Messages', 'Reviews', 'Responses'],
    datasets: [{
      label: 'Activity Score',
      data: [
        analytics.activityMetrics.posts,
        analytics.activityMetrics.comments,
        analytics.activityMetrics.messages,
        analytics.activityMetrics.reviews,
        analytics.activityMetrics.responses
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgb(54, 162, 235)',
      pointBackgroundColor: 'rgb(54, 162, 235)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(54, 162, 235)'
    }]
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === '7d' ? 'active' : ''} 
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''} 
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''} 
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="metrics-overview">
        <div className="metric-card">
          <h3>Total Views</h3>
          <p>{analytics.overview.totalViews}</p>
          <span className={`trend ${analytics.overview.viewsTrend > 0 ? 'positive' : 'negative'}`}>
            {analytics.overview.viewsTrend > 0 ? '↑' : '↓'} 
            {Math.abs(analytics.overview.viewsTrend)}%
          </span>
        </div>
        <div className="metric-card">
          <h3>Response Rate</h3>
          <p>{analytics.overview.responseRate}%</p>
          <span className="response-time">Avg: {analytics.overview.avgResponseTime}h</span>
        </div>
        <div className="metric-card">
          <h3>Success Rate</h3>
          <p>{analytics.overview.successRate}%</p>
          <span>{analytics.overview.completedDeals} deals</span>
        </div>
        <div className="metric-card">
          <h3>Rating</h3>
          <p>⭐ {analytics.overview.rating.toFixed(1)}</p>
          <span>{analytics.overview.reviewCount} reviews</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <h3>Performance Overview</h3>
          <Line 
            data={performanceData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Views & Interactions'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Category Breakdown</h3>
          <Doughnut 
            data={categoryData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Activity Metrics</h3>
          <Radar 
            data={activityMetrics}
            options={{
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      <div className="activity-feed">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-details">
                <p>{activity.description}</p>
                <span className="activity-time">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  switch (type) {
    case 'post': return '📝';
    case 'message': return '💬';
    case 'review': return '⭐';
    case 'deal': return '🤝';
    case 'view': return '👁';
    default: return '📌';
  }
}

export default UserDashboard; 