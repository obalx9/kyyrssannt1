import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { BookOpen, LogOut } from 'lucide-react';
import KursatLogo from '../components/KursatLogo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';

interface EnrolledCourse {
  id: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
  };
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadCourses();
    }
  }, [user, loading, navigate]);

  const loadCourses = async () => {
    try {
      const data = await apiClient.getStudentEnrollments();
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KursatLogo size={40} color="#0d9488" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('myCourses')}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.first_name || user?.telegram_username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSelector />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('noCourses')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('browseCoursesDesc')}
          </p>
        </main>
      </div>
    );
  }

  // Course list view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KursatLogo size={40} color="#0d9488" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('myCourses')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.first_name || user?.telegram_username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.filter((enrollment) => enrollment.course).map((enrollment) => (
            <button
              key={enrollment.id}
              onClick={() => navigate(`/course/${enrollment.course.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-lg transition-all text-left group"
            >
              {enrollment.course.thumbnail_url ? (
                <div className="w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={enrollment.course.thumbnail_url}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white opacity-80" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {enrollment.course.title}
                </h3>
                {enrollment.course.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {enrollment.course.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
