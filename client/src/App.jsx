import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout, PublicLayout } from './components/layout/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportPothole from './pages/ReportPothole';
import ComplaintDetail from './pages/ComplaintDetail';
import MunicipalDashboard from './pages/MunicipalDashboard';
import MunicipalComplaintDetail from './pages/MunicipalComplaintDetail';
import ContractorDashboard from './pages/ContractorDashboard';
import ContractorComplaintDetail from './pages/ContractorComplaintDetail';
import VerificationLab from './pages/VerificationLab';
import DashcamRoadmap from './pages/DashcamRoadmap';
import NotFound from './pages/NotFound';
import { dashboardPathFor } from './utils/helpers';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      <Route
        path="/citizen/*"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<CitizenDashboard view="dashboard" />} />
                <Route path="report" element={<ReportPothole />} />
                <Route path="complaint/:id" element={<ComplaintDetail />} />
                <Route path="map" element={<CitizenDashboard view="map" />} />
                <Route path="history" element={<CitizenDashboard view="history" />} />
                <Route path="roadmap" element={<DashcamRoadmap />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/municipal/*"
        element={
          <ProtectedRoute allowedRoles={['municipal']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<MunicipalDashboard view="dashboard" />} />
                <Route path="complaints" element={<MunicipalDashboard view="complaints" />} />
                <Route path="complaint/:id" element={<MunicipalComplaintDetail />} />
                <Route path="map" element={<MunicipalDashboard view="map" />} />
                <Route path="verification" element={<MunicipalDashboard view="verification" />} />
                <Route path="verification-lab" element={<VerificationLab />} />
                <Route path="roadmap" element={<DashcamRoadmap />} />
                <Route path="analytics" element={<MunicipalDashboard view="analytics" />} />
                <Route path="contractors" element={<MunicipalDashboard view="contractors" />} />
                <Route path="settings" element={<MunicipalDashboard view="settings" />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/contractor/*"
        element={
          <ProtectedRoute allowedRoles={['contractor']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<ContractorDashboard view="dashboard" />} />
                <Route path="active" element={<ContractorDashboard view="active" />} />
                <Route path="submitted" element={<ContractorDashboard view="submitted" />} />
                <Route path="verified" element={<ContractorDashboard view="verified" />} />
                <Route path="roadmap" element={<DashcamRoadmap />} />
                <Route path="complaint/:id" element={<ContractorComplaintDetail />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;