import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWithConfig } from '../../utils/api';
import './Services.css';

function Services() {
  const { category: urlCategory } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(urlCategory || '');

  useEffect(() => {
    setCategory(urlCategory || '');
  }, [urlCategory]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = category 
        ? `/api/services?category=${category}`
        : '/api/services';
      
      const response = await fetchWithConfig(endpoint);
      setServices(response);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>{category ? `${category} Services` : 'All Services'}</h1>
        <Link to="/post-service" className="post-service-button">Offer New Service</Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />            
        
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-filter"
        >
          <option value="">All Categories</option>
          <option value="cleaning">Cleaning</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="teaching">Teaching</option>
          <option value="it">IT Services</option>
          <option value="beauty">Beauty</option>
          <option value="moving">Moving</option>
          <option value="gardening">Gardening</option>
        </select>
      </div>
      
      {filteredServices.length === 0 ? (
        <p>No services found</p>
      ) : (
        <div className="services-grid">
          {filteredServices.map(service => (
            <Link to={`/service/${service.id}`} key={service.id} className="service-card">
              {service.image_url && (
                <div className="service-image">
                  <img 
                    src={`http://localhost:5000${service.image_url}`} 
                    alt={service.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                </div>
              )}
              <div className="service-content">
                <h3>{service.title}</h3>
                <p className="service-price">Starting at ${service.price}</p>
                <p className="service-category">{service.category}</p>
                <p className="service-description">
                  {service.description?.substring(0, 100)}...
                </p>
                <p className="service-location">📍 {service.location}</p>
                <p className="service-availability">⏰ {service.availability}</p>
                <p className="service-provider">Offered by: {service.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Services;