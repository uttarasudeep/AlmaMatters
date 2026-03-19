import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from './components/landerpage';
import Signup from './components/Signup';
import Login from './components/loginpage';
import HomePage from './components/HomePage';
import PlaceholderPage from './components/PlaceholderPage';

import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Sessions from './components/Sessions';

import StudentSignup from './components/StudentSignup';
import AlumniSignup from './components/AlumniSignup';
import AdminSignup from './components/AdminSignup';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/student" element={<StudentSignup />} />
          <Route path="/signup/alumni" element={<AlumniSignup />} />
          <Route path="/signup/admin" element={<AdminSignup />} />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Search" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Message Inbox" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Progress" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Jobs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Communities" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;