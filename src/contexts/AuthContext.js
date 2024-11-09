import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('Initializing auth with saved data:', { savedToken, savedUser });

      if (savedToken && savedUser) {
        try {
          const decodedToken = jwtDecode(savedToken);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            setToken(savedToken);
            setCurrentUser(JSON.parse(savedUser));
            console.log('Auth restored from localStorage');
          } else {
            console.log('Token expired, clearing auth');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token, user) => {
    console.log('Login called with:', { token, user });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setCurrentUser(user);
  };

  const logout = () => {
    console.log('Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
  };

  const isAuthenticated = () => {
    const isAuth = !!token && !!currentUser;
    console.log('isAuthenticated called:', isAuth);
    return isAuth;
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    isAuthenticated,
    loading
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext }; 