import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Store, Plus, Users, BookOpen, LogOut, Edit, Trash2, Eye, Send, MoreVertical } from 'lucide-react';
import KursatLogo from '../components/KursatLogo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import TelegramBotConfig from '../components/TelegramBotConfig';
import ConfirmDialog from '../components/ConfirmDialog';
import { apiClient } from '../lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  thumbnail_url: string | null;
  enrollment_count?: number | string;
}

interface Seller {
  id: string;
  business_name: string;
  is_approved: boolean;
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; courseId: string | null }>({ open: false, courseId: null });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('seller'))) {
      navigate('/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const loadData = async () => {
    try {
      const [sellerData, coursesData] = await Promise.all([
        apiClient.getSellerProfile().catch(() => null),
        apiClient.getSellerCourses().catch(() => []),
      ]);

      setSeller(sellerData);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) {
      alert(t('sellerNotFound'));
      return;
    }

    if (!seller.is_approved) {
      alert(t('sellerNotApproved'));
      return;
    }

    setCreating(true);
    try {
      const data = await apiClient.createCourse({
        title: newCourseTitle,
        description: newCourseDescription,
        price: 0,
        is_published: false,
      });

      setCourses([data, ...courses]);
      setShowCreateModal(false);
      setNewCourseTitle('');
      setNewCourseDescription('');
    } catch (error: any) {
      console.error('Error creating course:', error);
      const errorMessage = error?.message || t('failedToCreate');
      alert(`${t('failedToCreate')}: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await apiClient.deleteCourse(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(t('failedToDelete'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!seller?.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('pendingApprovalTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('pendingApprovalMessage')}
          </p>
          <button
            onClick={handleSignOut}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <KursatLogo size={40} color="#0d9488" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{seller.business_name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{t('sellerDashboard')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <LanguageSelector />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('myCourses')}</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('createNewCourse')}</span>
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('noCourses')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('browseCoursesDesc')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('createNewCourse')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex gap-3 p-4">
                    {course.thumbnail_url ? (
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center rounded-lg">
                        <BookOpen className="w-8 h-8 text-white opacity-80" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{course.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                course.is_published
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {course.is_published ? t('published') : t('draft')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {Number(course.enrollment_count) || 0}
                            </span>
                          </div>
                        </div>

                        <div className="relative flex-shrink-0" ref={openMenuId === course.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === course.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/seller/course/${course.id}`);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Edit className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                {t('editCourseTitle')}
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/course/${course.id}`);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                {t('viewAsStudent')}
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/seller/course/${course.id}/students`);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                                {t('manageStudentsTitle')}
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setSelectedCourseId(course.id);
                                  setShowTelegramConfig(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                {t('configureTelegramBotTitle')}
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteConfirm({ open: true, courseId: course.id });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('deleteCourseTitle')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/seller/course/${course.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors active:scale-95 touch-manipulation"
                    >
                      <Edit className="w-4 h-4" />
                      {t('edit')}
                    </button>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:block">
                  <div className="flex items-start">
                    {course.thumbnail_url ? (
                      <div className="w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg m-4">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 flex-shrink-0 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center rounded-lg m-4">
                        <BookOpen className="w-16 h-16 text-white opacity-80" />
                      </div>
                    )}
                    <div className="flex-1 p-6 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{course.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              course.is_published
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {course.is_published ? t('published') : t('draft')}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{Number(course.enrollment_count) || 0} {t('studentsCount')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setShowTelegramConfig(true);
                          }}
                          className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                          title={t('configureTelegramBotTitle')}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="p-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                          title={t('viewAsStudent')}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/seller/course/${course.id}`)}
                          className="p-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                          title={t('editCourseTitle')}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/seller/course/${course.id}/students`)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={t('manageStudentsTitle')}
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, courseId: course.id })}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('deleteCourseTitle')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('createNewCourse')}</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('businessName')} *
                </label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder={t('businessNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCourseTitle('');
                    setNewCourseDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newCourseTitle.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {creating ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTelegramConfig && selectedCourseId && (
        <TelegramBotConfig
          courseId={selectedCourseId}
          onClose={() => {
            setShowTelegramConfig(false);
            setSelectedCourseId(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, courseId: null })}
        onConfirm={() => {
          if (deleteConfirm.courseId) {
            handleDeleteCourse(deleteConfirm.courseId);
          }
        }}
        title={t('deleteCourseTitle')}
        message={t('deleteCourseConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </div>
  );
}
