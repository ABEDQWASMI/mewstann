import { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './PhoneVerification.css';

function PhoneVerification({ onVerificationComplete }) {
  const { auth } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/verify/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add token here
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/verify/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add token here
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-section">
      <h2>Phone Verification</h2>
      {error && <div className="error-message">{error}</div>}
      
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="verify-button"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label>Enter Verification Code:</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="verify-button"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button 
            type="button"
            onClick={() => setStep('phone')}
            className="back-button"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default PhoneVerification;