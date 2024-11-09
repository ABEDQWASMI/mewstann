import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          Yalado
        </Link>
      </div>

      <div className="navbar-menu">
        <Link to="/ads" className="navbar-item">Products</Link>
        <Link to="/services" className="navbar-item">Services</Link>
      </div>

      <div className="navbar-end">
        {isAuthenticated() ? (
          <>
            <div className="navbar-item has-dropdown">
              <button className="navbar-link user-menu-button">
                {currentUser?.username || 'Account'} ▼
              </button>
              <div className="navbar-dropdown">
                <Link to="/profile" className="dropdown-item">
                  <span className="icon">👤</span> Profile
                </Link>
                <Link to="/post-ad" className="dropdown-item">
                  <span className="icon">📦</span> Post Product
                </Link>
                <Link to="/post-service" className="dropdown-item">
                  <span className="icon">🛠️</span> Offer Service
                </Link>
                <Link to="/conversations" className="dropdown-item">
                  <span className="icon">💬</span> Messages
                </Link>
                <hr className="dropdown-divider" />
                <button onClick={handleLogout} className="dropdown-item logout-button">
                  <span className="icon">🚪</span> Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="navbar-item auth-button login">
              Login
            </Link>
            <Link to="/register" className="navbar-item auth-button register">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;