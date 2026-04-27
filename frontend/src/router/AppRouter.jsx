import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequireRole from './RequireRole';

import LoginPage        from '../pages/auth/LoginPage';
import RegisterPage     from '../pages/auth/RegisterPage';

import CandidateLayout  from '../components/layout/CandidateLayout';
import RecruiterLayout  from '../components/layout/RecruiterLayout';
import AdminLayout      from '../components/layout/AdminLayout';

import FeedPage         from '../pages/candidate/FeedPage';
import MyApplications   from '../pages/candidate/MyApplicationsPage';
import CandidateProfile from '../pages/candidate/ProfilePage';

import RecruiterDashboard from '../pages/recruiter/DashboardPage';
import MyJobsPage         from '../pages/recruiter/MyJobsPage';
import JobApplicantsPage  from '../pages/recruiter/JobApplicantsPage';

import AdminUsersPage     from '../pages/admin/UsersPage';
import AdminCompaniesPage from '../pages/admin/CompaniesPage';

import UnauthorizedPage from '../pages/UnauthorizedPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Candidate */}
        <Route path="/" element={
          <RequireRole role="CANDIDATE">
            <CandidateLayout />
          </RequireRole>
        }>
          <Route index element={<FeedPage />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile"      element={<CandidateProfile />} />
        </Route>

        {/* Recruiter */}
        <Route path="/recruiter" element={
          <RequireRole role="RECRUITER">
            <RecruiterLayout />
          </RequireRole>
        }>
          <Route index element={<RecruiterDashboard />} />
          <Route path="jobs"                element={<MyJobsPage />} />
          <Route path="jobs/:jobId/applicants" element={<JobApplicantsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <RequireRole role="ADMIN">
            <AdminLayout />
          </RequireRole>
        }>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users"     element={<AdminUsersPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
