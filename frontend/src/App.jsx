import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from './components/landerpage';
import Signup from './components/Signup';
import Login from './components/loginpage';
import HomePage from './components/HomePage';
import SearchUsers from './components/SearchUsers';
import UserProfile from './components/UserProfile';
import PlaceholderPage from './components/PlaceholderPage';
import Sessions from './components/Sessions';
import JobsPage from './components/JobsPage';
import AlumniJobsDashboard from './components/AlumniJobsDashboard';
import Messages from './components/Messages';

import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

import StudentSignup from './components/StudentSignup';
import AlumniSignup from './components/AlumniSignup';
import AdminSignup from './components/AdminSignup';
import EditStudentProfile from './components/EditStudentProfile';

import UserLayout from './components/UserLayout';  // new layout component

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
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* Protected pages – all require a username in the URL */}
          <Route path="/:username" element={<UserLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="search" element={<SearchUsers />} />
            <Route path="profile/:userType/:userId" element={<UserProfile />} />
            <Route path="messages" element={<Messages />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="progress" element={<PlaceholderPage title="Progress" />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="alumni-jobs" element={<AlumniJobsDashboard />} />
            <Route path="communities" element={<PlaceholderPage title="Communities" />} />
            <Route path="edit-profile" element={<EditStudentProfile />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;