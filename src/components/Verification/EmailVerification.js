import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EmailVerification.css';

function EmailVerification() {
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [error, setError] = useState(null);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/verification/email/verify/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      
      setVerificationStatus('success');
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error) {
      setVerificationStatus('error');
      setError(error.message);
    }
  };

  return (
    <div className="email-verification">
      {verificationStatus === 'pending' && (
        <div className="verification-pending">
          <h2>Verifying Email...</h2>
          <div className="loading-spinner"></div>
        </div>
      )}

      {verificationStatus === 'success' && (
        <div className="verification-success">
          <h2>✓ Email Verified</h2>
          <p>Your email has been successfully verified!</p>
          <p>Redirecting to your profile...</p>
        </div>
      )}

      {verificationStatus === 'error' && (
        <div className="verification-error">
          <h2>Verification Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/profile')}>
            Return to Profile
          </button>
        </div>
      )}
    </div>
  );
}

export default EmailVerification; 