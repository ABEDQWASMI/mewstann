import { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ActivityReports.css';

function ActivityReports() {
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    type: 'all',
    status: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    fetchActivities();
  }, [filters, pagination.page]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        type: filters.type,
        status: filters.status,
        page: pagination.page,
        limit: pagination.limit
      });

      const response = await fetch(
        `http://localhost:5000/api/analytics/activities?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setActivities(data.activities);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/analytics/export?format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-report-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.message);
    }
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'listing', label: 'Listings' },
    { value: 'message', label: 'Messages' },
    { value: 'transaction', label: 'Transactions' },
    { value: 'review', label: 'Reviews' }
  ];

  const statusTypes = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="activity-reports">
      <div className="reports-header">
        <h1>Activity Reports</h1>
        <div className="export-buttons">
          <button onClick={() => handleExport('csv')}>Export CSV</button>
          <button onClick={() => handleExport('pdf')}>Export PDF</button>
          <button onClick={() => handleExport('xlsx')}>Export Excel</button>
        </div>
      </div>

      <div className="filters-section">
        <div className="date-filters">
          <div className="date-picker">
            <label>Start Date</label>
            <DatePicker
              selected={filters.startDate}
              onChange={date => setFilters(prev => ({ ...prev, startDate: date }))}
              maxDate={filters.endDate}
            />
          </div>
          <div className="date-picker">
            <label>End Date</label>
            <DatePicker
              selected={filters.endDate}
              onChange={date => setFilters(prev => ({ ...prev, endDate: date }))}
              minDate={filters.startDate}
            />
          </div>
        </div>

        <div className="type-filters">
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            {statusTypes.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading activities...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="activities-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{new Date(activity.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`activity-type ${activity.type}`}>
                        {activity.type}
                      </span>
                    </td>
                    <td>{activity.description}</td>
                    <td>
                      <span className={`status ${activity.status}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="details-button"
                        onClick={() => {/* Handle viewing details */}}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ActivityReports; 