import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScrollPreferencesProvider } from './contexts/ScrollPreferencesContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SellerRegistrationPage from './pages/SellerRegistrationPage';
import StudentDashboard from './pages/StudentDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseView from './pages/CourseView';
import CourseEdit from './pages/CourseEdit';
import StudentsManager from './pages/StudentsManager';
import BottomNavigation from './components/BottomNavigation';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isPublicPage = location.pathname === '/login' || location.pathname === '/register-seller' || location.pathname === '/';
  const needsBottomPadding = user && !isPublicPage;

  return (
    <div className={needsBottomPadding ? 'pb-20 md:pb-0' : ''}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-seller" element={<SellerRegistrationPage />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/course/:courseId" element={<CourseEdit />} />
        <Route path="/seller/course/:courseId/students" element={<StudentsManager />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/course/:courseId" element={<CourseView />} />
        <Route path="/health" element={<div>OK</div>} />
        <Route path="/api/*" element={<div>API</div>} />
      </Routes>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ScrollPreferencesProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </ScrollPreferencesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
