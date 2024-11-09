import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWithConfig } from '../../utils/api';
import './Ads.css';

function Ads() {
  const { category: urlCategory } = useParams();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(urlCategory || '');

  useEffect(() => {
    setCategory(urlCategory || '');
  }, [urlCategory]);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = category 
        ? `/api/listings?category=${category}`
        : '/api/listings';
      
      const response = await fetchWithConfig(endpoint);
      setAds(response);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="ads-container">
      <div className="ads-header">
        <h1>{category ? `${category} Products` : 'All Products'}</h1>
        <Link to="/post-ad" className="post-ad-button">Post New Ad</Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search ads..."
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
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="clothing">Clothing</option>
          <option value="vehicles">Vehicles</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      {filteredAds.length === 0 ? (
        <p>No products found</p>
      ) : (
        <div className="ads-grid">
          {filteredAds.map(ad => (
            <Link to={`/ad/${ad.id}`} key={ad.id} className="ad-card">
              {ad.image_url && (
                <div className="ad-image">
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
              <div className="ad-content">
                <h3>{ad.title}</h3>
                <p className="ad-price">${ad.price}</p>
                <p className="ad-category">{ad.category}</p>
                <p className="ad-description">
                  {ad.description?.substring(0, 100)}...
                </p>
                <p className="ad-seller">Posted by: {ad.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Ads;