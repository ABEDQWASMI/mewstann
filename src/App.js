import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile/Profile';
import PrivateRoute from './components/Auth/PrivateRoute';
import PostAd from './components/Ads/PostAd';
import AdDetail from './components/Ads/AdDetail';
import Messages from './components/Messages/Messages';
import PostService from './components/Services/PostService';
import ServiceDetail from './components/Services/ServiceDetail';
import Conversations from './components/Conversations/Conversations';
import Ads from './components/Ads/Ads';
import Services from './components/Services/Services';
import './App.css';

// Wrapper component to handle auth loading state
function AuthenticatedApp() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/post-ad" 
          element={
            <PrivateRoute>
              <PostAd />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/post-service" 
          element={
            <PrivateRoute>
              <PostService />
            </PrivateRoute>
          } 
        />
        <Route path="/ads" element={<Ads />} />
        <Route path="/ads/category/:category" element={<Ads />} />
        <Route path="/ad/:id" element={<AdDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/category/:category" element={<Services />} />
        <Route path="/service/:id" element={<ServiceDetail />} />
        <Route 
          path="/messages/:conversationId" 
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          } 
        />
        <Route path="/conversations" element={<Messages />} />
        <Route path="/messages" element={<Messages />} />
        {/* Catch all route for 404s */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Public route wrapper to redirect authenticated users
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated()) {
    // Redirect to the page they came from or home
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </Router>
  );
}

export default App;