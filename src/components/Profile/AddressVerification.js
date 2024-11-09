import { useState } from 'react';
import './AddressVerification.css';

function AddressVerification({ onVerificationComplete }) {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStep, setVerificationStep] = useState('input'); // 'input', 'verification', 'complete'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/verify/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(address)
      });

      if (!response.ok) {
        throw new Error('Failed to submit address');
      }

      const data = await response.json();
      if (data.verified) {
        setVerificationStep('complete');
        onVerificationComplete();
      } else {
        setVerificationStep('verification');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-verification-container">
      <h2>Address Verification</h2>
      
      {verificationStep === 'input' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({...address, street: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({...address, city: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({...address, state: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={address.zipCode}
                onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={address.country}
              onChange={(e) => setAddress({...address, country: e.target.value})}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Verify Address'}
          </button>
        </form>
      )}

      {verificationStep === 'verification' && (
        <div className="verification-pending">
          <h3>Verification Pending</h3>
          <p>We've sent a verification code to your address. Please enter it below:</p>
          {/* Add verification code input here */}
        </div>
      )}

      {verificationStep === 'complete' && (
        <div className="verification-complete">
          <h3>✓ Address Verified</h3>
          <p>Your address has been successfully verified!</p>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default AddressVerification; 