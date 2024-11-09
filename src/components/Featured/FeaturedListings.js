import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FeaturedListings.css';

function FeaturedListings() {
  const [featuredItems, setFeaturedItems] = useState({
    ads: [],
    services: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/featured', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch featured items');
      
      const data = await response.json();
      setFeaturedItems(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="featured-loading">Loading featured items...</div>;
  if (error) return <div className="featured-error">{error}</div>;

  return (
    <div className="featured-listings">
      <section className="featured-section">
        <h2>Featured Products</h2>
        <div className="featured-grid">
          {featuredItems.ads.map(ad => (
            <Link to={`/ad/${ad.id}`} key={ad.id} className="featured-card">
              <div className="featured-badge">Featured</div>
              {ad.image_url && (
                <div className="featured-image">
                  <img src={`http://localhost:5000${ad.image_url}`} alt={ad.title} />
                </div>
              )}
              <div className="featured-content">
                <h3>{ad.title}</h3>
                <p className="featured-price">${ad.price}</p>
                <p className="featured-description">
                  {ad.description.substring(0, 100)}...
                </p>
                <div className="featured-meta">
                  <span className="featured-views">👁 {ad.views}</span>
                  <span className="featured-date">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <h2>Featured Services</h2>
        <div className="featured-grid">
          {featuredItems.services.map(service => (
            <Link to={`/service/${service.id}`} key={service.id} className="featured-card">
              <div className="featured-badge">Featured</div>
              {service.image_url && (
                <div className="featured-image">
                  <img src={`http://localhost:5000${service.image_url}`} alt={service.title} />
                </div>
              )}
              <div className="featured-content">
                <h3>{service.title}</h3>
                <p className="featured-price">Starting at ${service.price}</p>
                <p className="featured-description">
                  {service.description.substring(0, 100)}...
                </p>
                <div className="featured-meta">
                  <span className="featured-rating">⭐ {service.rating || 'New'}</span>
                  <span className="featured-reviews">({service.review_count || 0})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default FeaturedListings; 