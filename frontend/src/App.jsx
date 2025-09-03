import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import AdminPage from './pages/AdminPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AboutPage from './pages/AboutPage';

const RequireAuth = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden professional-scroll">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/calendar" 
                element={
                  <RequireAuth>
                    <div className="min-h-screen">
                      <Navbar />
                      <main className="content-with-navbar main-scroll">
                        <CalendarPage />
                      </main>
                    </div>
                  </RequireAuth>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <RequireAuth>
                    <div className="min-h-screen">
                      <Navbar />
                      <main className="content-with-navbar main-scroll">
                        <AdminPage />
                      </main>
                    </div>
                  </RequireAuth>
                } 
              />
              <Route 
                path="/my-bookings" 
                element={
                  <RequireAuth>
                    <div className="min-h-screen">
                      <Navbar />
                      <main className="content-with-navbar main-scroll">
                        <MyBookingsPage />
                      </main>
                    </div>
                  </RequireAuth>
                } 
              />
              
              {/* Redirect old routes */}
              <Route path="/dashboard" element={<Navigate to="/calendar" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
