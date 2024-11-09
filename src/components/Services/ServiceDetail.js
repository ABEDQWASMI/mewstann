import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Services.css';

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServiceDetails = useCallback(async () => {
    try {
      console.log('Fetching service details for ID:', id);
      const response = await fetch(`http://localhost:5000/api/services/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch service details');
      }

      console.log('Received service data:', data);
      setService(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching service details:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const handleContact = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          other_user_id: service.user_id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      // Navigate to messages with the new conversation ID
      navigate(`/messages/${data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error.message);
    }
  }, [token, service?.user_id, navigate]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!service) return <div className="error-message">Service not found</div>;

  return (
    <div className="service-detail-container">
      <div className="service-detail-content">
        <div className="service-detail-header">
          <h2>{service.title}</h2>
          <button onClick={() => navigate('/services')} className="back-button">
            Back to Services
          </button>
        </div>

        {service.image_url && (
          <div className="service-detail-image">
            <img 
              src={`http://localhost:5000${service.image_url}`} 
              alt={service.title} 
            />
          </div>
        )}

        <div className="service-detail-info">
          <div className="service-detail-main">
            <div className="service-price-category">
              <p className="service-price">Starting at ${service.price}</p>
              <p className="service-category">Category: {service.category}</p>
            </div>

            <div className="service-provider-info">
              <p className="service-provider">
                <span className="info-label">Service Provider:</span> {service.username}
              </p>
              <p className="service-location">
                <span className="info-label">📍 Location:</span> {service.location}
              </p>
              <p className="service-availability">
                <span className="info-label">⏰ Availability:</span> {service.availability}
              </p>
              <p className="service-date">
                <span className="info-label">Posted:</span> {
                  new Date(service.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }
              </p>
            </div>
          </div>

          <div className="service-description">
            <h3>Service Description</h3>
            <p>{service.description}</p>
          </div>

          <div className="service-actions">
            {currentUser?.id === service.user_id ? (
              <div className="owner-actions">
                <p className="owner-message">This is your service</p>
                <button 
                  onClick={() => navigate(`/edit-service/${id}`)} 
                  className="edit-button"
                >
                  Edit Service
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this service?')) {
                      fetch(`/api/services/${id}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      })
                      .then(res => {
                        if (res.ok) {
                          navigate('/services');
                        } else {
                          throw new Error('Failed to delete service');
                        }
                      })
                      .catch(err => {
                        console.error('Error deleting service:', err);
                        alert('Failed to delete service');
                      });
                    }
                  }}
                  className="delete-button"
                >
                  Delete Service
                </button>
              </div>
            ) : (
              <button onClick={handleContact} className="contact-button">
                Contact Service Provider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail; 