import { useState, useEffect } from 'react';
import './SubscriptionPlans.css';

function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentPlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subscription/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch current plan');
      const data = await response.json();
      setCurrentPlan(data);
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) throw new Error('Failed to subscribe');
      
      const data = await response.json();
      setCurrentPlan(data);
      // Redirect to payment page or show success message
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading plans...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="subscription-plans">
      <h2>Subscription Plans</h2>
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`plan-card ${currentPlan?.id === plan.id ? 'current' : ''}`}>
            <h3>{plan.name}</h3>
            <p className="price">${plan.price}/month</p>
            <ul className="features">
              <li>✓ {plan.monthly_ad_limit} ads per month</li>
              {JSON.parse(plan.features).featured && <li>✓ Featured listings</li>}
              {JSON.parse(plan.features).priority_support && <li>✓ Priority support</li>}
            </ul>
            {currentPlan?.id === plan.id ? (
              <button disabled>Current Plan</button>
            ) : (
              <button onClick={() => handleSubscribe(plan.id)}>
                Subscribe
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionPlans; 