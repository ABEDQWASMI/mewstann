import { useState, useEffect } from 'react';
import './VerificationCenter.css';

function VerificationCenter() {
  const [verificationStatus, setVerificationStatus] = useState({
    phone: false,
    email: false,
    address: false,
    identity: false
  });
  const [activeStep, setActiveStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/verification/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch verification status');
      
      const data = await response.json();
      setVerificationStatus(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async (type) => {
    setActiveStep(type);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/verification/${type}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Failed to start ${type} verification`);
      
      const data = await response.json();
      // Handle different verification types
      switch(type) {
        case 'phone':
          // Show phone verification UI
          break;
        case 'email':
          // Show email verification UI
          break;
        case 'address':
          // Show address verification UI
          break;
        case 'identity':
          // Show identity verification UI
          break;
        default:
          break;
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const verificationSteps = [
    {
      type: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number to enable secure communications',
      icon: '📱'
    },
    {
      type: 'email',
      title: 'Email Verification',
      description: 'Confirm your email address for important notifications',
      icon: '📧'
    },
    {
      type: 'address',
      title: 'Address Verification',
      description: 'Verify your address to build trust with buyers and sellers',
      icon: '🏠'
    },
    {
      type: 'identity',
      title: 'Identity Verification',
      description: 'Verify your identity for enhanced account security',
      icon: '🪪'
    }
  ];

  if (loading) return <div className="verification-loading">Loading verification status...</div>;

  return (
    <div className="verification-center">
      <h2>Verification Center</h2>
      <p className="verification-intro">
        Complete verification steps to unlock additional features and build trust with other users.
      </p>

      <div className="verification-steps">
        {verificationSteps.map(step => (
          <div 
            key={step.type}
            className={`verification-step ${verificationStatus[step.type] ? 'completed' : ''}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-content">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {verificationStatus[step.type] ? (
                <span className="verified-badge">✓ Verified</span>
              ) : (
                <button 
                  onClick={() => startVerification(step.type)}
                  className="verify-button"
                >
                  Start Verification
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="verification-error">{error}</div>}

      {/* Verification step modals */}
      {activeStep && (
        <div className="verification-modal">
          {/* Render different verification forms based on activeStep */}
        </div>
      )}
    </div>
  );
}

export default VerificationCenter; 