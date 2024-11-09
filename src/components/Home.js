import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { fetchWithConfig } from '../utils/api';

function Home() {
  const [featuredAds, setFeaturedAds] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories] = useState([
    { name: 'Electronics', icon: '💻', path: '/ads/category/electronics', type: 'product' },
    { name: 'Furniture', icon: '🪑', path: '/ads/category/furniture', type: 'product' },
    { name: 'Clothing', icon: '👕', path: '/ads/category/clothing', type: 'product' },
    { name: 'Vehicles', icon: '🚗', path: '/ads/category/vehicles', type: 'product' },
    { name: 'Other', icon: '📦', path: '/ads/category/other', type: 'product' }
  ]);

  const [serviceCategories] = useState([
    { name: 'Cleaning', icon: '🧹', path: '/services/category/cleaning', type: 'service' },
    { name: 'Plumbing', icon: '🔧', path: '/services/category/plumbing', type: 'service' },
    { name: 'Electrical', icon: '⚡', path: '/services/category/electrical', type: 'service' },
    { name: 'Teaching', icon: '📚', path: '/services/category/teaching', type: 'service' },
    { name: 'IT Services', icon: '💻', path: '/services/category/it', type: 'service' },
    { name: 'Beauty', icon: '💅', path: '/services/category/beauty', type: 'service' },
    { name: 'Moving', icon: '🚚', path: '/services/category/moving', type: 'service' },
    { name: 'Gardening', icon: '🌱', path: '/services/category/gardening', type: 'service' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch featured ads
        const adsResponse = await fetchWithConfig('/api/listings?limit=3')
          .catch(error => {
            console.error('Error fetching ads:', error);
            return [];
          });

        // Fetch featured services
        const servicesResponse = await fetchWithConfig('/api/services?limit=3')
          .catch(error => {
            console.error('Error fetching services:', error);
            return [];
          });

        setFeaturedAds(Array.isArray(adsResponse) ? adsResponse : []);
        setFeaturedServices(Array.isArray(servicesResponse) ? servicesResponse : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Render featured items only if they exist
  const renderFeaturedAds = () => {
    if (featuredAds.length === 0) {
      return <p>No featured products available</p>;
    }

    return (
      <div className="featured-grid">
        {featuredAds.map(ad => (
          <Link to={`/ad/${ad.id}`} key={ad.id} className="featured-card">
            {ad.image_url && (
              <div className="featured-image">
                <img 
                  src={`http://localhost:5000${ad.image_url}`} 
                  alt={ad.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              </div>
            )}
            <div className="featured-content">
              <h3>{ad.title}</h3>
              <p className="featured-price">${ad.price}</p>
              <p className="featured-description">
                {ad.description?.substring(0, 100)}...
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderFeaturedServices = () => {
    if (featuredServices.length === 0) {
      return <p>No featured services available</p>;
    }

    return (
      <div className="featured-grid">
        {featuredServices.map(service => (
          <Link to={`/service/${service.id}`} key={service.id} className="featured-card service-feature">
            {service.image_url && (
              <div className="featured-image">
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
            <div className="featured-content">
              <h3>{service.title}</h3>
              <p className="featured-price">Starting at ${service.price}</p>
              <p className="featured-description">
                {service.description?.substring(0, 100)}...
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Yalado</h1>
          <p>Your Local Marketplace for Products & Services</p>
          <div className="hero-buttons">
            <div className="button-group">
              <Link to="/post-ad" className="btn btn-primary">Post Product</Link>
              <Link to="/post-service" className="btn btn-primary">Offer Service</Link>
            </div>
            <div className="button-group">
              <Link to="/ads" className="btn btn-secondary">Browse Products</Link>
              <Link to="/services" className="btn btn-secondary">Find Services</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Browse Product Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link to={category.path} key={category.name} className="category-card">
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="categories-section service-categories">
        <h2>Popular Services</h2>
        <div className="categories-grid">
          {serviceCategories.map((category) => (
            <Link to={category.path} key={category.name} className="category-card service-card">
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="featured-column">
            <h2>Featured Products</h2>
            {renderFeaturedAds()}
          </div>

          <div className="featured-column">
            <h2>Featured Services</h2>
            {renderFeaturedServices()}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How Yalado Works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-icon">📝</div>
            <h3>Create Account</h3>
            <p>Sign up for free and join our community</p>
          </div>
          <div className="step">
            <div className="step-icon">📸</div>
            <h3>Post or Search</h3>
            <p>List your items or services, or find what you need</p>
          </div>
          <div className="step">
            <div className="step-icon">💬</div>
            <h3>Connect</h3>
            <p>Chat with sellers, service providers, or customers</p>
          </div>
          <div className="step">
            <div className="step-icon">🤝</div>
            <h3>Make Deals</h3>
            <p>Meet safely and complete your transaction</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Start?</h2>
        <p>Join thousands of users buying, selling, and offering services on Yalado</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/services/popular" className="btn btn-secondary">Popular Services</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
