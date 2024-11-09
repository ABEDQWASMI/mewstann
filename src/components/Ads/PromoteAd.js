import { useState } from 'react';
import './PromoteAd.css';

function PromoteAd({ adId, onPromotionComplete }) {
  const [promotionPlan, setPromotionPlan] = useState('');
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const promotionPlans = [
    { id: 'featured', name: 'Featured Listing', price: 9.99, description: 'Show your ad in featured section' },
    { id: 'premium', name: 'Premium Listing', price: 19.99, description: 'Top of search results + featured section' },
    { id: 'spotlight', name: 'Spotlight', price: 29.99, description: 'Homepage spotlight + all premium features' }
  ];

  const handlePromote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ads/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adId,
          promotionPlan,
          duration
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to promote ad');

      const data = await response.json();
      onPromotionComplete(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promote-ad-container">
      <h2>Promote Your Ad</h2>
      
      <div className="promotion-plans">
        {promotionPlans.map(plan => (
          <div 
            key={plan.id} 
            className={`plan-card ${promotionPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setPromotionPlan(plan.id)}
          >
            <h3>{plan.name}</h3>
            <p className="price">${plan.price}/week</p>
            <p className="description">{plan.description}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handlePromote}>
        <div className="form-group">
          <label>Duration (days)</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        <div className="total-cost">
          Total Cost: $
          {promotionPlan && 
            (promotionPlans.find(p => p.id === promotionPlan).price * (duration / 7)).toFixed(2)
          }
        </div>

        <button 
          type="submit" 
          disabled={!promotionPlan || loading}
          className="promote-button"
        >
          {loading ? 'Processing...' : 'Promote Now'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default PromoteAd; 