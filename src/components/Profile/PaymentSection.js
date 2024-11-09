import { useState } from 'react';
import './Profile.css';

function PaymentSection({ userId }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = [
    { id: 1, name: 'Basic', price: 9.99, features: ['Post up to 5 ads', 'Basic analytics'] },
    { id: 2, name: 'Pro', price: 19.99, features: ['Unlimited ads', 'Advanced analytics', 'Featured listings'] },
    { id: 3, name: 'Business', price: 49.99, features: ['Everything in Pro', 'Priority support', 'Custom branding'] }
  ];

  const handlePayment = async (planId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId,
          userId
        })
      });

      if (!response.ok) throw new Error('Failed to create payment session');

      const data = await response.json();
      window.location.href = data.url; // Redirect to payment page
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-section">
      <h2>Premium Plans</h2>
      <div className="plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <h3>{plan.name}</h3>
            <p className="price">${plan.price}/month</p>
            <ul>
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handlePayment(plan.id)}
              disabled={loading}
              className="payment-button"
            >
              {loading ? 'Processing...' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default PaymentSection; 